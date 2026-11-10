+++
title = "Writing your first Lua script for Valkey"
date = 2026-11-15
description = "Two clients can sell the last ticket twice when they read and update stock with separate commands. Here is how a Lua script turns the check and the update into a single step."
authors =  ["dragosandriciuc"]
[taxonomies]
blog_type = ["How-to"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-02.webp"
+++

Imagine two customers click "Buy" on the last concert ticket at the same moment.
Your application reads the stock from Valkey, and both requests see `1`.
Both requests decide the ticket is available, and both decrement the stock.
You have just sold one ticket twice.

The cause of this is how Valkey serves clients.
Your application does not have a single private connection to Valkey.
Each request can use its own connection, and Valkey runs commands from all connections one at a time, in the order they arrive.
Your application sends `GET`, waits for the answer, and then sends `DECR`.
Valkey can run a command from another connection between those two.
That is an intended behavior, but a decision based on the `GET` can be out of date by the time the `DECR` command arrives.

A Lua script solves this.
You send a short program to Valkey, and Valkey runs the whole script, its logic and its commands, as one step.
No other client's command runs in between.

## What is a Lua script in Valkey?

In Valkey, server-side scripting is the feature, [Lua](https://www.lua.org/) is the language, and [`EVAL`](https://valkey.io/commands/eval/) and [`EVALSHA`](https://valkey.io/commands/evalsha/) are the commands that run a Lua script.

A Lua script is a short program you send to Valkey.
The `EVAL` command sends the script source with every call while the `EVALSHA` command runs a script the server has already cached, with `EVALSHA` being the most commonly used.

[`EVAL_RO`](https://valkey.io/commands/eval_ro/) is the read-only variant of `EVAL`.
Valkey rejects any write command inside it, so you can run it safely on a replica.

Valkey runs a script atomically.
No other client's command runs while the script runs, so other clients see the data as it was before the script or after it, never halfway through.

Here is how Valkey runs a Lua script:

![Lua script execution flow](/assets/media/pictures/atomic_ticket_eval.svg)

Since Valkey 9.1, Lua runs as a module, so engines such as [LuaJIT](https://github.com/valkey-io/valkey-luajit) or [Lua 5.5](https://github.com/valkey-io/valkey-lua5.5) can replace the built-in Lua 5.1, which this post uses.
In the future, the same engine API could host a non-Lua language.

## Reproduce the double sale

The steps below simulate two requests with [`valkey-cli`](https://valkey.io/topics/cli/), run from your shell.

1. Set the stock to one ticket:

    ```bash
    valkey-cli SET {concert}:stock 1
    ```

2. Run these commands in order.
    Each `GET` and `DECR` pair stands for one request, and interleaving them shows what happens when two requests overlap:

    ```text
    $ valkey-cli GET {concert}:stock      # request A reads
    "1"
    $ valkey-cli GET {concert}:stock      # request B reads
    "1"
    $ valkey-cli DECR {concert}:stock     # request A sells
    (integer) 0
    $ valkey-cli DECR {concert}:stock     # request B sells
    (integer) -1
    ```

Both requests read `1`, so both decided the ticket was available.
The stock ends at `-1`: you sold two tickets and had one.

For stock alone, `DECR` by itself is enough: it decrements atomically, and a negative result tells you the ticket was already gone.
Real purchase logic usually needs more, for example one ticket per customer.
That in turn takes two keys, a customer ID, and a decision, which no single command covers.

The examples in this post use Valkey 9.1 with the default configuration and valkey-py 6.2.

## Fix the double sale with a Lua script

Now run the check and the update as one script.

1. Save this script as `buy_ticket.lua`.
It refuses the sale if the stock is gone or the customer already has a ticket, and otherwise records the buyer and lowers the stock:

    ```lua
    local stock = tonumber(server.call('GET', KEYS[1]))
    if not stock or stock <= 0 then
        return 0
    end
    if server.call('SADD', KEYS[2], ARGV[1]) == 0 then
        return -1
    end
    server.call('DECR', KEYS[1])
    return 1
    ```

2. Reset the stock to two tickets and clear the buyer list:

    ```bash
    valkey-cli SET {concert}:stock 2
    valkey-cli DEL {concert}:buyers
    ```

3. Run the script with `--eval`.
Key names come first, then a comma surrounded by spaces, then the arguments.
Alice clicks twice, then Bob and Carol buy:

    ```text
    $ valkey-cli --eval buy_ticket.lua {concert}:stock {concert}:buyers , alice
    (integer) 1
    $ valkey-cli --eval buy_ticket.lua {concert}:stock {concert}:buyers , alice
    (integer) -1
    $ valkey-cli --eval buy_ticket.lua {concert}:stock {concert}:buyers , bob
    (integer) 1
    $ valkey-cli --eval buy_ticket.lua {concert}:stock {concert}:buyers , carol
    (integer) 0
    ```

`1` means sold, `0` means sold out, and `-1` means the customer already has a ticket.
The stock ends at `0`, and the buyer list holds Alice and Bob.

This is atomicity in practice.
The read, the check, and both writes run as one step, so no other request can act on the stock between them.
One call also replaces three commands and the decision between them.

## Why are KEYS and ARGV separate?

In Valkey, `KEYS` holds the names of every key the script touches and `ARGV` holds everything else: values, IDs, limits.
This is not enforced, and in standalone mode a script that reads a key name from `ARGV` works.
In a cluster, however, this breaks:

- With the key name in `KEYS`, the client routes the script to the node that owns the key, and it works from any node.
- With the same key name in `ARGV`, it works only when the script happens to land on the owning node.
Elsewhere it fails with the following error: `ERR Attempted to access a non local key in a cluster node script`.
- Keys in `KEYS` **must** share a hash slot, or the call fails with the error: `CROSSSLOT Keys in request don't hash to the same slot`.
The `{concert}` part of the key names is a hash tag: Valkey hashes only that part, so both keys land in the same slot.

Declare every key in `KEYS`, even in standalone mode, so the script keeps working when you move to a cluster.

## Call the script from your application

In an application, you send the same script through your client library.
This snippet example uses [valkey-py](https://github.com/valkey-io/valkey-py), installed with `pip install valkey`:

```python
import valkey

BUY_TICKET = """
local stock = tonumber(server.call('GET', KEYS[1]))
if not stock or stock <= 0 then
return 0
end
if server.call('SADD', KEYS[2], ARGV[1]) == 0 then
return -1
end
server.call('DECR', KEYS[1])
return 1
"""

client = valkey.Valkey(host="localhost", port=6379)
buy_ticket = client.register_script(BUY_TICKET)

client.set("{concert}:stock", 2)
client.delete("{concert}:buyers")

messages = {1: "bought a ticket", 0: "found the event sold out", -1: "already has a ticket"}
for customer in ["alice", "alice", "bob", "carol"]:
    result = buy_ticket(keys=["{concert}:stock", "{concert}:buyers"], args=[customer])
    print(customer, messages[result])
```

```text
alice bought a ticket
alice already has a ticket
bob bought a ticket
carol found the event sold out
```

`register_script` loads the script once and then calls it with `EVALSHA`, falling back to loading it again if the server returns `NOSCRIPT`.

## What are the advantages?

Lua scripts allow you to:

- Run scripts server side: they read and write data in fewer round trips, with less latency and less network traffic.
- Put data-dependent logic next to the data: Lua can validate inputs, branch on values read from Valkey, and return a result without sending intermediate values back to the application.
- Use atomic execution: no other client's commands run until the whole script finishes running.
A long-running script can then delay unrelated requests, not just requests for the stock key.
- Combine existing commands to implement application-specific operations that Valkey doesn't provide as a single command.

There are, however, some constraints when using Lua:

- After a script runs longer than `busy-reply-threshold` (5000 ms by default), Valkey replies to other clients with a `BUSY` error, and the script keeps running.
- There is no rollback.
If a command fails halfway through a script, the earlier writes stay.
- Starting with Valkey 8.0, Valkey keeps at most 500 scripts loaded with `EVAL` or `EVAL_RO` and evicts the least recently used (LRU) ones.
This limit protects memory from applications that embed values in the script source, which creates a new cached script on every call.
The 500-script limit is [fixed in the source](https://github.com/valkey-io/valkey/blob/9.1.2/src/eval.c#L350) for Valkey 9.1 and cannot be configured.
- Starting with Valkey 9.2, the [`maxmemory-scripts`](https://github.com/valkey-io/valkey/blob/9.2.0-rc2/valkey.conf#L2792) option caps the memory of scripts loaded with `EVAL` or `EVAL_RO`, as an absolute size or a percentage of `maxmemory`, independent of the 500-script limit.
Scripts loaded with `SCRIPT LOAD` are not evicted by either limit, so pass values in `ARGV` and load scripts once.

## Try Lua scripts yourself

Run the double sale example on your own Valkey instance and compare your output with the output above.
Then change the script to read the quantity from `ARGV[2]`, so one script handles orders of any size.

If something in this post is unclear, [open an issue](https://github.com/valkey-io/valkey-io.github.io/issues).
