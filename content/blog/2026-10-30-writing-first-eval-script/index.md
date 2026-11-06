+++
title = "Writing your first Valkey EVAL script"
date = 2026-10-30
description = "Two clients can sell the last ticket twice when GET and SET run separately. Here is how an EVAL script closes the gap."
authors =  ["dragosandriciuc"]
[taxonomies]
blog_type = ["How-to"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-02.webp"
+++

Imagine two customers click "Buy" on the last concert ticket at the same moment.
Your application reads the stock from Valkey, and both requests see `1`.
Both requests decide the ticket is available, and both write `0`.
You sold one ticket twice.

The cause is a gap between two commands.
Your application sends `GET`, waits for the answer, and then sends `SET`.
Another client can run a command inside that gap.

An `EVAL` script closes the gap.
You send a short program to Valkey, and Valkey runs all of its commands as one step.
No other client's command runs in between.

This post explains what an `EVAL` script is, how the `EVAL` command is structured, and how Valkey runs it.
You will be able to reproduce the double sale in `valkey-cli`, fix it with your first `EVAL` script, and then learn what limits to expect in production.

## What is an `EVAL` script?

In Valkey, an `EVAL` script is a Lua script.
You send it to the server with the [`EVAL`](https://valkey.io/commands/eval/) command.
The script runs atomically, meaning no other client's command runs until the script finishes.

In short, server-side scripting is the feature, Lua is the language you write the script in, and `EVAL` is the command that runs it.

Here is how Valkey runs an `EVAL` script:

![EVAL script execution flow](/assets/media/pictures/atomic_ticket_eval.png)

## Double sale reproduced

Let's circle back to the double sale problem.
You can see it in action by using two terminals and [`valkey-cli`](https://valkey.io/topics/cli/).

1. Set the stock to one ticket:

```bash
valkey-cli SET tickets 1
```

2. Open two terminals and start `valkey-cli` in each.

3. Run the commands in this order, typing each one after the `127.0.0.1:6379>` prompt.
The order matches what two requests produce when they arrive at the same moment:

```text
# Terminal A
127.0.0.1:6379> GET tickets
"1"

# Terminal B
127.0.0.1:6379> GET tickets
"1"

# Terminal A
127.0.0.1:6379> SET tickets 0
OK

# Terminal B
127.0.0.1:6379> SET tickets 0
OK
```

Both terminals read `1`, so both decided the ticket was available.
Both wrote `0`, so the stock looks correct, but you sold two tickets and had only one.
Each Valkey command succeeded, but the problem is that your application split one decision across two commands.
The manual sequence reproduces the interleaving that can occur between two application requests.

The two terminals above run one command after the other.
The above results show the outcome of the race, not the race itself.

The examples in this post use Valkey 9.1.2 with the default configuration and valkey-py version 6.2.0.

## Fix the double sale with an `EVAL` script

Now run the check and the update as one script.
The example assumes a valid stock value.

1. Set the stock to one ticket again:

```bash
valkey-cli SET tickets 1
```

2. Read the script.
It reads the stock, and only if a ticket is left, it lowers the stock by one:

```lua
local stock = tonumber(server.call('GET', KEYS[1]))
if stock and stock > 0 then
    server.call('SET', KEYS[1], stock - 1)
    return 1
end
return 0
```

3. Run the script in Terminal A as an `EVAL` command.
`valkey-cli` reads each line as a separate command, so the script must be on one line:

```text
127.0.0.1:6379> EVAL "local stock = tonumber(server.call('GET', KEYS[1])); if stock and stock > 0 then server.call('SET', KEYS[1], stock - 1); return 1 end; return 0" 1 tickets
(integer) 1
```

4. Run the same command in Terminal B:

```text
127.0.0.1:6379> EVAL "local stock = tonumber(server.call('GET', KEYS[1])); if stock and stock > 0 then server.call('SET', KEYS[1], stock - 1); return 1 end; return 0" 1 tickets
(integer) 0
```

5. Check the stock:

```text
127.0.0.1:6379> GET tickets
"0"
```

Terminal A sold the ticket and Terminal B was told the stock was gone.
As you can see, the order of commands is the same as in the broken example.
However, Valkey ran each script as **one** step, so there was no gap for the second client to use.

The command has three parts:

- The quoted text is the Lua script.
- `1` is `numkeys`, the number of arguments that follow it that are key names.
- `tickets` is that key name. Inside the script it is `KEYS[1]`.

You can describe the return values with your own convention, in this case `1` means sold and `0` means sold out.
Any arguments after the key names go to the script as `ARGV[1]`, `ARGV[2]`, and so on.

Tip: For longer scripts, save the script from step 2 as `ticket.lua` and run it from the shell instead:

```bash
valkey-cli --eval ticket.lua tickets
```

## Call the script from your application

In an application, you send the same script through your client library.
This snippet example uses [valkey-py](https://github.com/valkey-io/valkey-py), installed with `pip install valkey`:

```python
import valkey

BUY_TICKET = """
local stock = tonumber(server.call('GET', KEYS[1]))
if stock and stock > 0 then
  server.call('SET', KEYS[1], stock - 1)
  return 1
end
return 0
"""
client = valkey.Valkey(host="localhost", port=6379, decode_responses=True)
client.set("tickets", 1)

for customer in ["Alice", "Bob"]:
    sold = client.eval(BUY_TICKET, 1, "tickets")
    print(customer, "bought a ticket" if sold == 1 else "found the event sold out")
```

The output then reads:

```text
Alice bought a ticket
Bob found the event sold out
```

As you can see, `client.eval` takes the same parts as the `EVAL` command: the script, `numkeys`, and the key names.

## What are the advantages?

Using `EVAL` allows you to:

- Run scripts server side: they read and write data in fewer round trips, with less latency and less network traffic.
- Use atomic execution: no other client's commands run until the whole script finishes running.
A long-running script can then delay unrelated requests, not just requests for the tickets key.
- Combine existing commands to implement application-specific operations that Valkey doesn't provide as a single command.
- Reuse scripts: Valkey caches the scripts it runs by their Secure Hash Algorithm 1 (SHA1) digest, so you can load a script once with [`SCRIPT LOAD`](https://valkey.io/commands/script-load/) and run it later with [`EVALSHA`](https://valkey.io/commands/evalsha/) (invokes a script by its digest if that script is present in the server's cache) instead of resending the source.

There are, however, some constraints when using `EVAL`:

- After a script runs longer than `busy-reply-threshold` (5000 ms by default), Valkey replies to other clients with a `BUSY` error, and the script keeps running.
- There is no rollback.
If a command fails halfway through a script, the earlier writes stay.
- Starting with Valkey 8.0, Valkey keeps at most a fixed number of scripts loaded with `EVAL` or `EVAL_RO` and evicts the least recently used (LRU) ones.
On Valkey 9.1.2 the limit was 500 scripts.
Scripts loaded with `SCRIPT LOAD` are not evicted this way.

## Try `EVAL` scripts yourself

Run the double sale example on your own Valkey instance and compare your output with the output above.
Then change the script to read the quantity from `ARGV[1]`, so one script handles orders of any size.

If something in this post is unclear, [open an issue](https://github.com/valkey-io/valkey-io.github.io/issues).
