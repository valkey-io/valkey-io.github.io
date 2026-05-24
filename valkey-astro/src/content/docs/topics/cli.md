---
title: "CLI"
description: >
    Valkey command line interface
---

## Usage

**`valkey-cli`** [_OPTIONS_] [_cmd_ [_arg_...]]

## Description

The Valkey command line interface is used for administration, troubleshooting and experimenting with Valkey.

In interactive mode, `valkey-cli` has basic line editing capabilities to provide a familiar typing experience.

To launch the program in special modes, you can use several options, including:

* Simulate a replica and print the replication stream it receives from the primary.
* Check the latency of a Valkey server and display statistics. 
* Request ASCII-art spectrogram of latency samples and frequencies.

This topic covers the different aspects of `valkey-cli`, starting from the simplest and ending with the more advanced features.

## Options

**`-h`** _hostname_
: Server hostname (default: `$VALKEYCLI_HOST` if set, otherwise 127.0.0.1).

**`-p`** _port_
: Server port (default: `$VALKEYCLI_PORT` if set, otherwise 6379).

**`-t`** _timeout_
: Server connection timeout in seconds (decimals allowed).
  Default timeout is 0, meaning no limit, depending on the OS.

**`-s`** _socket_
: Server socket (overrides hostname and port).

**`-a`** _password_
: Password to use when connecting to the server.
  You can also use the `VALKEYCLI_AUTH` environment
  variable to pass this password more safely.
  (If both are used, this argument takes precedence.)

**`--user`** _username_
: Used to send ACL style 'AUTH username pass'. Needs `-a`.

**`--pass`** _password_
: Alias of -a for consistency with the new --user option.

**`--askpass`**
: Force user to input password with mask from STDIN.
  If this argument is used, `-a` and the `VALKEYCLI_AUTH`
  environment variable will be ignored.

**`-u`** _uri_
: Server URI on format `valkey://user:password@host:port/dbnum`.
  User, password and dbnum are optional. For authentication
  without a username, use username 'default'. For TLS, use
  the scheme 'valkeys'.

**`-r`** _repeat_
: Execute specified command N times.

**`-i`** _interval_
: When `-r` is used, waits _interval_ seconds per command.
  It is possible to specify sub-second times like `-i 0.1`.
  This interval is also used in `--scan` and `--stat` per cycle.
  and in `--bigkeys`, `--memkeys`, and `--hotkeys` per 100 cycles.

**`-n`** _db_
: Database number.

**`-2`**
: Start session in RESP2 protocol mode.

**`-3`**
: Start session in RESP3 protocol mode.

**`-x`**
: Read last argument from STDIN (see example below).

**`-X`**
: Read <tag> argument from STDIN (see example below).

**`-d`** _delimiter_
: Delimiter between response bulks for raw formatting (default: `\n`).

**`-D`** _delimiter_
: Delimiter between responses for raw formatting (default: `\n`).

**`-c`**
: Enable cluster mode (follow -ASK and -MOVED redirections).

**`-e`**
: Return exit error code when command execution fails.

**`-4`**
: Prefer IPv4 over IPv6 on DNS lookup.

**`-6`**
: Prefer IPv6 over IPv4 on DNS lookup.'

**`--tls`**
: Establish a secure TLS connection.

**`--sni`** _host_
: Server name indication for TLS.

**`--cacert`** _file_
: CA Certificate file to verify with.

**`--cacertdir`** _dir_
: Directory where trusted CA certificates are stored.
  If neither cacert nor cacertdir are specified, the default
  system-wide trusted root certs configuration will apply.

**`--insecure`**
: Allow insecure TLS connection by skipping cert validation.

**`--cert`** _file_
: Client certificate to authenticate with.

**`--key`** _file_
: Private key file to authenticate with.

**`--tls-ciphers`** _list_
: Sets the list of preferred ciphers (TLSv1.2 and below)
  in order of preference from highest to lowest separated by colon (":").
  See the **ciphers**(1ssl) manpage for more information about the syntax of this string.

**`--tls-ciphersuites`** _list_
: Sets the list of preferred ciphersuites (TLSv1.3)
  in order of preference from highest to lowest separated by colon (":").
  See the **ciphers**(1ssl) manpage for more information about the syntax of this string,
  and specifically for TLSv1.3 ciphersuites.

**`--rdma`**
: Establish an RDMA connection.

**`--mptcp`**
: Establish an MPTCP connection.

**`--raw`**
: Use raw formatting for replies (default when STDOUT is
  not a tty).

**`--no-raw`**
: Force formatted output even when STDOUT is not a tty.

**`--quoted-input`**
: Force input to be handled as quoted strings.

**`--csv`**
: Output in CSV format.

**`--json`**
: Output in JSON format (default RESP3, use -2 if you want to use with RESP2).

**`--quoted-json`**
: Same as --json, but produce ASCII-safe quoted strings, not Unicode.

**`--show-pushes`** **`yes`**|**`no`**
: Whether to print RESP3 PUSH messages.  Enabled by default when
  STDOUT is a tty but can be overridden with --show-pushes no.

**`--stat`**
: Print rolling stats about server: mem, clients, ...

**`--latency`**
: Enter a special mode continuously sampling latency.
  If you use this mode in an interactive session it runs
  forever displaying real-time stats. Otherwise if `--raw` or
  `--csv` is specified, or if you redirect the output to a non
  TTY, it samples the latency for 1 second (you can use
  `-i` to change the interval), then produces a single output
  and exits.

**`--latency-history`**
: Like `--latency` but tracking latency changes over time.
  Default time interval is 15 sec. Change it using `-i`.

**`--latency-dist`**
: Shows latency as a spectrum, requires xterm 256 colors.
  Default time interval is 1 sec. Change it using `-i`.

**`--lru-test`** _keys_
: Simulate a cache workload with an 80-20 distribution.

**`--replica`**
: Simulate a replica showing commands received from the primary.

**`--rdb`** _filename_
: Transfer an RDB dump from remote server to local file.
  Use filename of "-" to write to stdout.

**`--functions-rdb`** _filename_
: Like `--rdb` but only get the functions (not the keys)
  when getting the RDB dump file.

**`--pipe`**
: Transfer raw RESP protocol from stdin to server.

**`--pipe-timeout`** _n_
: In `--pipe` mode, abort with error if after sending all data.
  no reply is received within _n_ seconds.
  Default timeout: 30. Use 0 to wait forever.

**`--bigkeys`**
: Sample keys looking for keys with many elements (complexity).

**`--memkeys`**
: Sample keys looking for keys consuming a lot of memory.

**`--memkeys-samples`** _n_
: Sample keys looking for keys consuming a lot of memory.
  And define number of key elements to sample

**`--hotkeys`**
: Sample keys looking for hot keys.
  Only works when maxmemory-policy is `*lfu`.
  This is equivalent to --hotkeys-count 16.

**`--hotkeys-count`** _n_
: Sample keys looking for the n most hot keys.
  Only works when maxmemory-policy is `*lfu`.

**`--scan`**
: List all keys using the SCAN command.

**`--pattern`** _pat_
: Keys pattern when using the `--scan`, `--bigkeys` or `--hotkeys`
  options (default: `*`).

**`--count`** _count_
: Count option when using the `--scan`, `--bigkeys` or `--hotkeys` (default: 10).

**`--quoted-pattern`** _pat_
: Same as `--pattern`, but the specified string can be
  quoted, in order to pass an otherwise non binary-safe string.

**`--intrinsic-latency`** _sec_
: Run a test to measure intrinsic system latency.
  The test will run for the specified amount of seconds.

**`--eval`** _file_
: Send an EVAL command using the Lua script at _file_.

**`--ldb`**
: Used with `--eval` enable the Server Lua debugger.

**`--ldb-sync-mode`**
: Like `--ldb` but uses the synchronous Lua debugger, in
  this mode the server is blocked and script changes are
  not rolled back from the server memory.

**`--cluster`** _command_ [_args_...] [_opts_...]
: Cluster Manager command and arguments (see below).

**`--verbose`**
: Verbose mode.

**`--no-auth-warning`**
: Don't show warning message when using password on command
  line interface.

**`--help`**
: Output help and exit.

**`--version`**
: Output version and exit.

## Cluster Manager commands

For management of [Valkey Cluster](cluster-tutorial.md), the following syntax is used:

**`valkey-cli`** **`--cluster`** _command_ [_args_...] [_opts_...]

```
  Command        Args
  --------------------------------------------------------------------------------
  create         host1:port1 ... hostN:portN
                 --cluster-replicas <arg>
  check          <host:port> or <host> <port> - separated by either colon or space
                 --cluster-search-multiple-owners
  info           <host:port> or <host> <port> - separated by either colon or space
  fix            <host:port> or <host> <port> - separated by either colon or space
                 --cluster-search-multiple-owners
                 --cluster-fix-with-unreachable-masters
  reshard        <host:port> or <host> <port> - separated by either colon or space
                 --cluster-from <arg>
                 --cluster-to <arg>
                 --cluster-slots <arg>
                 --cluster-yes
                 --cluster-timeout <arg>
                 --cluster-pipeline <arg>
                 --cluster-replace
  rebalance      <host:port> or <host> <port> - separated by either colon or space
                 --cluster-weight <node1=w1...nodeN=wN>
                 --cluster-use-empty-masters
                 --cluster-timeout <arg>
                 --cluster-simulate
                 --cluster-pipeline <arg>
                 --cluster-threshold <arg>
                 --cluster-replace
  add-node       new_host:new_port existing_host:existing_port
                 --cluster-replica
                 --cluster-master-id <arg>
  del-node       host:port node_id
  call           host:port command arg arg .. arg
                 --cluster-only-masters
                 --cluster-only-replicas
  set-timeout    host:port milliseconds
  import         host:port
                 --cluster-from <arg>
                 --cluster-from-user <arg>
                 --cluster-from-pass <arg>
                 --cluster-from-askpass
                 --cluster-copy
                 --cluster-replace
  backup         host:port backup_directory
  help
```

## Command line usage

To run a Valkey command and return a standard output at the terminal, include the command to execute as separate arguments of `valkey-cli`:

    $ valkey-cli INCR mycounter
    (integer) 7

The reply of the command is "7". Since Valkey replies are typed (strings, arrays, integers, nil, errors, etc.), you see the type of the reply between parentheses. This additional information may not be ideal when the output of `valkey-cli` must be used as input of another command or redirected into a file.

`valkey-cli` only shows additional information for human readability when it detects the standard output is a tty, or terminal. For all other outputs it will auto-enable the *raw output mode*, as in the following example:

    $ valkey-cli INCR mycounter > /tmp/output.txt
    $ cat /tmp/output.txt
    8

Note that `(integer)` is omitted from the output because `valkey-cli` detects
the output is no longer written to the terminal. You can force raw output
even on the terminal with the `--raw` option:

    $ valkey-cli --raw INCR mycounter
    9

You can force human readable output when writing to a file or in
pipe to other commands by using `--no-raw`.

## String quoting and escaping

When `valkey-cli` parses a command, whitespace characters automatically delimit the arguments.
In interactive mode, a newline sends the command for parsing and execution.
To input string values that contain whitespaces or non-printable characters, you can use quoted and escaped strings.

Quoted string values are enclosed in double (`"`) or single (`'`) quotation marks.
Escape sequences are used to put nonprintable characters in character and string literals.

An escape sequence contains a backslash (`\`) symbol followed by one of the escape sequence characters.

Doubly-quoted strings support the following escape sequences:

* `\"` - double-quote
* `\n` - newline
* `\r` - carriage return
* `\t` - horizontal tab
* `\b` - backspace
* `\a` - alert
* `\\` - backslash
* `\xhh` - any ASCII character represented by a hexadecimal number (_hh_)

Single quotes assume the string is literal, and allow only the following escape sequences:
* `\'` - single quote
* `\\` - backslash

For example, to return `Hello World` on two lines:

```
127.0.0.1:6379> SET mykey "Hello\nWorld"
OK
127.0.0.1:6379> GET mykey
Hello
World
```

When you input strings that contain single or double quotes, as you might in passwords, for example, escape the string, like so: 

```
127.0.0.1:6379> AUTH some_admin_user ">^8T>6Na{u|jp>+v\"55\@_;OU(OR]7mbAYGqsfyu48(j'%hQH7;v*f1H${*gD(Se'"
 ```

## Host, port, password, and database

By default, `valkey-cli` connects to the server at the address 127.0.0.1 with port 6379.
You can change the port using several command line options. To specify a different host name or an IP address, use the `-h` option. In order to set a different port, use `-p`.

    $ valkey-cli -h valkey15.example.com -p 6390 PING
    PONG

If your instance is password protected, the `-a <password>` option will
perform authentication saving the need of explicitly using the `AUTH` command:

    $ valkey-cli -a myUnguessablePazzzzzword123 PING
    PONG

**NOTE:** For security reasons, provide the password to `valkey-cli` automatically via the
`VALKEYCLI_AUTH` environment variable.

Finally, it's possible to send a command that operates on a database number
other than the default number zero by using the `-n <dbnum>` option:

    $ valkey-cli FLUSHALL
    OK
    $ valkey-cli -n 1 INCR a
    (integer) 1
    $ valkey-cli -n 1 INCR a
    (integer) 2
    $ valkey-cli -n 2 INCR a
    (integer) 1

Some or all of this information can also be provided by using the `-u <uri>`
option and the URI pattern `valkey://user:password@host:port/dbnum`:

    $ valkey-cli -u valkey://LJenkins:p%40ssw0rd@valkey-16379.example.com:16379/0 PING
    PONG

**NOTE:**
User, password and dbnum are optional.
For authentication without a username, use username `default`.
For TLS, use the scheme `valkeys`.

## SSL/TLS

By default, `valkey-cli` uses a plain TCP connection to connect to Valkey.
You may enable SSL/TLS using the `--tls` option, along with `--cacert` or
`--cacertdir` to configure a trusted root certificate bundle or directory.

If the target server requires authentication using a client side certificate,
you can specify a certificate and a corresponding private key using `--cert` and
`--key`.

## Getting input from other programs

There are two ways you can use `valkey-cli` in order to receive input from other
commands via the standard input. One is to use the target payload as the last argument
from *stdin*. For example, in order to set the Valkey key `net_services`
to the content of the file `/etc/services` from a local file system, use the `-x`
option:

    $ valkey-cli -x SET net_services < /etc/services
    OK
    $ valkey-cli GETRANGE net_services 0 50
    "#\n# Network services, Internet style\n#\n# Note that "

In the first line of the above session, `valkey-cli` was executed with the `-x` option and a file was redirected to the CLI's
standard input as the value to satisfy the `SET net_services` command phrase. This is useful for scripting.

A different approach is to feed `valkey-cli` a sequence of commands written in a
text file:

    $ cat /tmp/commands.txt
    SET item:3374 100
    INCR item:3374
    APPEND item:3374 xxx
    GET item:3374
    $ cat /tmp/commands.txt | valkey-cli
    OK
    (integer) 101
    (integer) 6
    "101xxx"

All the commands in `commands.txt` are executed consecutively by
`valkey-cli` as if they were typed by the user in interactive mode. Strings can be
quoted inside the file if needed, so that it's possible to have single
arguments with spaces, newlines, or other special characters:

    $ cat /tmp/commands.txt
    SET arg_example "This is a single argument"
    STRLEN arg_example
    $ cat /tmp/commands.txt | valkey-cli
    OK
    (integer) 25

## Continuously run the same command

It is possible to execute a single command a specified number of times
with a user-selected pause between executions. This is useful in
different contexts - for example when we want to continuously monitor some
key content or `INFO` field output, or when we want to simulate some
recurring write event, such as pushing a new item into a list every 5 seconds.

This feature is controlled by two options: `-r <count>` and `-i <delay>`.
The `-r` option states how many times to run a command and `-i` sets
the delay between the different command calls in seconds (with the ability
to specify values such as 0.1 to represent 100 milliseconds).

By default the interval (or delay) is set to 0, so commands are just executed
ASAP:

    $ valkey-cli -r 5 INCR counter_value
    (integer) 1
    (integer) 2
    (integer) 3
    (integer) 4
    (integer) 5

To run the same command indefinitely, use `-1` as the count value.
To monitor over time the RSS memory size it's possible to use the following command:

    $ valkey-cli -r -1 -i 1 INFO | grep rss_human
    used_memory_rss_human:2.71M
    used_memory_rss_human:2.73M
    used_memory_rss_human:2.73M
    used_memory_rss_human:2.73M
    ... a new line will be printed each second ...

## Mass insertion of data using `valkey-cli`

Mass insertion using `valkey-cli` is covered in a separate page as it is a
worthwhile topic itself. Please refer to our [mass insertion guide](mass-insertion.md).

## CSV output

A CSV (Comma Separated Values) output feature exists within `valkey-cli` to export data from Valkey to an external program.  

    $ valkey-cli LPUSH mylist a b c d
    (integer) 4
    $ valkey-cli --csv LRANGE mylist 0 -1
    "d","c","b","a"

Note that the `--csv` flag will only work on a single command, not the entirety of a DB as an export.

## Running Lua scripts

The `valkey-cli` has extensive support for using the debugging facility
of Lua scripting, available with Valkey 3.2 onwards. For this feature, refer to the [Valkey Lua debugger documentation](ldb.md).

Even without using the debugger, `valkey-cli` can be used to
run scripts from a file as an argument:

    $ cat /tmp/script.lua
    return server.call('SET',KEYS[1],ARGV[1])
    $ valkey-cli --eval /tmp/script.lua location:hastings:temp , 23
    OK

The Valkey `EVAL` command takes the list of keys the script uses, and the
other non key arguments, as different arrays. When calling `EVAL` you
provide the number of keys as a number. 

When calling `valkey-cli` with the `--eval` option above, there is no need to specify the number of keys
explicitly. Instead it uses the convention of separating keys and arguments
with a comma. This is why in the above call you see `location:hastings:temp , 23` as arguments.

So `location:hastings:temp` will populate the `KEYS` array, and `23` the `ARGV` array.

The `--eval` option is useful when writing simple scripts. For more
complex work, the Lua debugger is recommended. It is possible to mix the two approaches, since the debugger can also execute scripts from an external file.

Interactive mode
===

We have explored how to use the Valkey CLI as a command line program.
This is useful for scripts and certain types of testing, however most
people will spend the majority of time in `valkey-cli` using its interactive
mode.

In interactive mode the user types Valkey commands at the prompt. The command
is sent to the server, processed, and the reply is parsed back and rendered
into a simpler form to read.

Nothing special is needed for running the `valkey-cli` in interactive mode -
just execute it without any arguments

    $ valkey-cli
    127.0.0.1:6379> PING
    PONG

The string `127.0.0.1:6379>` is the prompt. It displays the connected Valkey server instance's hostname and port.

The prompt updates as the connected server changes or when operating on a database different from the database number zero:

    127.0.0.1:6379> SELECT 2
    OK
    127.0.0.1:6379[2]> DBSIZE
    (integer) 1
    127.0.0.1:6379[2]> SELECT 0
    OK
    127.0.0.1:6379> DBSIZE
    (integer) 503

## Handling connections and reconnections

Using the `CONNECT` command in interactive mode makes it possible to connect
to a different instance, by specifying the *hostname* and *port* we want
to connect to:

    127.0.0.1:6379> CONNECT metal 6379
    metal:6379> PING
    PONG

As you can see the prompt changes accordingly when connecting to a different server instance.
If a connection is attempted to an instance that is unreachable, the `valkey-cli` goes into disconnected
mode and attempts to reconnect with each new command:

    127.0.0.1:6379> CONNECT 127.0.0.1 9999
    Could not connect to Valkey at 127.0.0.1:9999: Connection refused
    not connected> PING
    Could not connect to Valkey at 127.0.0.1:9999: Connection refused
    not connected> PING
    Could not connect to Valkey at 127.0.0.1:9999: Connection refused

Generally after a disconnection is detected, `valkey-cli` always attempts to
reconnect transparently; if the attempt fails, it shows the error and
enters the disconnected state. The following is an example of disconnection
and reconnection:

    127.0.0.1:6379> INFO SERVER
    Could not connect to Valkey at 127.0.0.1:6379: Connection refused
    not connected> PING
    PONG
    127.0.0.1:6379> 
    (now we are connected again)

When a reconnection is performed, `valkey-cli` automatically re-selects the
last database number selected. However, all other states about the
connection is lost, such as within a MULTI/EXEC transaction:

    $ valkey-cli
    127.0.0.1:6379> MULTI
    OK
    127.0.0.1:6379> PING
    QUEUED

    ( here the server is manually restarted )

    127.0.0.1:6379> EXEC
    (error) ERR EXEC without MULTI

This is usually not an issue when using the `valkey-cli` in interactive mode for
testing, but this limitation should be known.

## Editing, history, completion and hints

Because `valkey-cli` uses the "linenoise" line editing library shipped with
Valkey, it has line editing capabilities without depending on `libreadline` or
other optional libraries.

Command execution history can be accessed in order to avoid retyping commands by pressing the arrow keys (up and down).
The history is preserved between restarts of the CLI, in a file named
`.valkeycli_history` inside the user home directory, as specified
by the `HOME` environment variable. It is possible to use a different
history filename by setting the `REDISCLI_HISTFILE` environment variable,
and disable it by setting it to `/dev/null`.

The `valkey-cli` is also able to perform command-name completion by pressing the TAB
key, as in the following example:

    127.0.0.1:6379> Z<TAB>
    127.0.0.1:6379> ZADD<TAB>
    127.0.0.1:6379> ZCARD<TAB>

Once Valkey command name has been entered at the prompt, the `valkey-cli` will display
syntax hints. Like command history, this behavior can be turned on and off via the `valkey-cli` preferences.

## Preferences

There are two ways to customize `valkey-cli` behavior. The file `.valkeyclirc`
in the home directory is loaded by the CLI on startup. You can override the
file's default location by setting the `REDISCLI_RCFILE` environment variable to
an alternative path. Preferences can also be set during a CLI session, in which 
case they will last only the duration of the session.

To set preferences, use the special `:set` command. The following preferences
can be set, either by typing the command in the CLI or adding it to the
`.valkeyclirc` file:

* `:set hints` - enables syntax hints
* `:set nohints` - disables syntax hints

## Running the same command N times

It is possible to run the same command multiple times in interactive mode by prefixing the command
name by a number:

    127.0.0.1:6379> 5 INCR mycounter
    (integer) 1
    (integer) 2
    (integer) 3
    (integer) 4
    (integer) 5

## Showing help about Valkey commands

`valkey-cli` provides online help for most Valkey [commands](../commands/), using the `HELP` command. The command can be used
in two forms:

* `HELP @<category>` shows all the commands about a given category. The
categories are: 
    - `@generic`
    - `@string`
    - `@list`
    - `@set`
    - `@sorted_set`
    - `@hash`
    - `@pubsub`
    - `@transactions`
    - `@connection`
    - `@server`
    - `@scripting`
    - `@hyperloglog`
    - `@cluster`
    - `@geo`
    - `@stream`
* `HELP <commandname>` shows specific help for the command given as argument.

For example in order to show help for the `PFADD` command, use:

    127.0.0.1:6379> HELP PFADD

    PFADD key element [element ...]
    summary: Adds the specified elements to the specified HyperLogLog.
    since: 2.8.9

Note that `HELP` supports TAB completion as well.

## Clearing the terminal screen

Using the `CLEAR` command in interactive mode clears the terminal's screen.

Special modes of operation
===

So far we saw two main modes of `valkey-cli`.

* Command line execution of Valkey commands.
* Interactive "REPL" usage.

The CLI performs other auxiliary tasks related to Valkey that
are explained in the next sections:

* Monitoring tool to show continuous stats about a Valkey server.
* Scanning a Valkey database for very large keys.
* Key space scanner with pattern matching.
* Acting as a [Pub/Sub](pubsub.md) client to subscribe to channels.
* Monitoring the commands executed into a Valkey instance.
* Checking the [latency](latency.md) of a Valkey server in different ways.
* Checking the scheduler latency of the local computer.
* Transferring RDB backups from a remote Valkey server locally.
* Acting as a Valkey replica for showing what a replica receives.
* Simulating [LRU](lru-cache.md) workloads for showing stats about keys hits.
* A client for the Lua debugger.

## Continuous stats mode

Continuous stats mode is probably one of the lesser known yet very useful features of `valkey-cli` to monitor Valkey instances in real time. To enable this mode, the `--stat` option is used.
The output is very clear about the behavior of the CLI in this mode:

    $ valkey-cli --stat
    ------- data ------ --------------------- load -------------------- - child -
    keys       mem      clients blocked requests            connections
    506        1015.00K 1       0       24 (+0)             7
    506        1015.00K 1       0       25 (+1)             7
    506        3.40M    51      0       60461 (+60436)      57
    506        3.40M    51      0       146425 (+85964)     107
    507        3.40M    51      0       233844 (+87419)     157
    507        3.40M    51      0       321715 (+87871)     207
    508        3.40M    51      0       408642 (+86927)     257
    508        3.40M    51      0       497038 (+88396)     257

In this mode a new line is printed every second with useful information and differences of request values between old data points. Memory usage, client connection counts, and various other statistics about the connected Valkey database can be easily understood with this auxiliary `valkey-cli` tool.

The `-i <interval>` option in this case works as a modifier in order to
change the frequency at which new lines are emitted. The default is one
second.

## Scanning for big keys

In this special mode, `valkey-cli` works as a key space analyzer. It scans the
dataset for big keys, but also provides information about the data types
that the data set consists of. This mode is enabled with the `--bigkeys` option,
and produces verbose output:

    $ valkey-cli --bigkeys

    # Scanning the entire keyspace to find biggest keys as well as
    # average sizes per key type.  You can use -i 0.01 to sleep 0.01 sec
    # per SCAN command (not usually needed).

    [00.00%] Biggest string found so far 'key-419' with 3 bytes
    [05.14%] Biggest list   found so far 'mylist' with 100004 items
    [35.77%] Biggest string found so far 'counter:__rand_int__' with 6 bytes
    [73.91%] Biggest hash   found so far 'myobject' with 3 fields

    -------- summary -------

    Sampled 506 keys in the keyspace!
    Total key length in bytes is 3452 (avg len 6.82)

    Biggest string found 'counter:__rand_int__' has 6 bytes
    Biggest   list found 'mylist' has 100004 items
    Biggest   hash found 'myobject' has 3 fields

    504 strings with 1403 bytes (99.60% of keys, avg size 2.78)
    1 lists with 100004 items (00.20% of keys, avg size 100004.00)
    0 sets with 0 members (00.00% of keys, avg size 0.00)
    1 hashs with 3 fields (00.20% of keys, avg size 3.00)
    0 zsets with 0 members (00.00% of keys, avg size 0.00)

In the first part of the output, each new key larger than the previous larger
key (of the same type) encountered is reported. The summary section
provides general stats about the data inside the Valkey instance.

The program uses the `SCAN` command, so it can be executed against a busy
server without impacting the operations, however the `-i` option can be
used in order to throttle the scanning process of the specified fraction
of second for each `SCAN` command. 

For example, `-i 0.01` will slow down the program execution considerably, but will also reduce the load on the server
to a negligible amount.

Note that the summary also reports in a cleaner form the biggest keys found
for each time. The initial output is just to provide some interesting info
ASAP if running against a very large data set.

## Getting a list of keys

It is also possible to scan the key space, again in a way that does not
block the Valkey server (which does happen when you use a command
like `KEYS *`), and print all the key names, or filter them for specific
patterns. This mode, like the `--bigkeys` option, uses the `SCAN` command,
so keys may be reported multiple times if the dataset is changing, but no
key would ever be missing, if that key was present since the start of the
iteration. Because of the command that it uses this option is called `--scan`.

    $ valkey-cli --scan | head -10
    key-419
    key-71
    key-236
    key-50
    key-38
    key-458
    key-453
    key-499
    key-446
    key-371

Note that `head -10` is used in order to print only the first ten lines of the
output.

Scanning is able to use the underlying pattern matching capability of
the `SCAN` command with the `--pattern` option.

    $ valkey-cli --scan --pattern '*-11*'
    key-114
    key-117
    key-118
    key-113
    key-115
    key-112
    key-119
    key-11
    key-111
    key-110
    key-116

Piping the output through the `wc` command can be used to count specific
kind of objects, by key name:

    $ valkey-cli --scan --pattern 'user:*' | wc -l
    3829433

You can use `-i 0.01` to add a delay between calls to the `SCAN` command.
This will make the command slower but will significantly reduce load on the server.

## Pub/sub mode

The CLI is able to publish messages in Valkey Pub/Sub channels using
the `PUBLISH` command. Subscribing to channels in order to receive
messages is different - the terminal is blocked and waits for
messages, so this is implemented as a special mode in `valkey-cli`. Unlike
other special modes this mode is not enabled by using a special option,
but simply by using the `SUBSCRIBE` or `PSUBSCRIBE` command, which are available in
interactive or command mode:

    $ valkey-cli PSUBSCRIBE '*'
    Reading messages... (press Ctrl-C to quit)
    1) "PSUBSCRIBE"
    2) "*"
    3) (integer) 1

The *reading messages* message shows that we entered Pub/Sub mode.
When another client publishes some message in some channel, such as with the command `valkey-cli PUBLISH mychannel mymessage`, the CLI in Pub/Sub mode will show something such as:

    1) "pmessage"
    2) "*"
    3) "mychannel"
    4) "mymessage"

This is very useful for debugging Pub/Sub issues.
To exit the Pub/Sub mode just process `CTRL-C`.

## Monitoring commands executed in Valkey

Similarly to the Pub/Sub mode, the monitoring mode is entered automatically
once you use the `MONITOR` command. All commands received by the active Valkey instance will be printed to the standard output:

    $ valkey-cli MONITOR
    OK
    1460100081.165665 [0 127.0.0.1:51706] "set" "shipment:8000736522714:status" "sorting"
    1460100083.053365 [0 127.0.0.1:51707] "get" "shipment:8000736522714:status"

Note that it is possible to pipe the output, so you can monitor
for specific patterns using tools such as `grep`.

## Monitoring the latency of Valkey instances

Valkey is often used in contexts where latency is very critical. Latency
involves multiple moving parts within the application, from the client library
to the network stack, to the Valkey instance itself.

The `valkey-cli` has multiple facilities for studying the latency of a Valkey
instance and understanding the latency's maximum, average and distribution.

The basic latency-checking tool is the `--latency` option. Using this
option the CLI runs a loop where the `PING` command is sent to the Valkey
instance and the time to receive a reply is measured. This happens 100
times per second, and stats are updated in a real time in the console:

    $ valkey-cli --latency
    min: 0, max: 1, avg: 0.19 (427 samples)

The stats are provided in milliseconds. Usually, the average latency of
a very fast instance tends to be overestimated a bit because of the
latency due to the kernel scheduler of the system running `valkey-cli`
itself, so the average latency of 0.19 above may easily be 0.01 or less.
However this is usually not a big problem, since most developers are interested in
events of a few milliseconds or more.

Sometimes it is useful to study how the maximum and average latencies
evolve during time. The `--latency-history` option is used for that
purpose: it works exactly like `--latency`, but every 15 seconds (by
default) a new sampling session is started from scratch:

    $ valkey-cli --latency-history
    min: 0, max: 1, avg: 0.14 (1314 samples) -- 15.01 seconds range
    min: 0, max: 1, avg: 0.18 (1299 samples) -- 15.00 seconds range
    min: 0, max: 1, avg: 0.20 (113 samples)^C

Sampling sessions' length can be changed with the `-i <interval>` option.

The most advanced latency study tool, but also the most complex to
interpret for non-experienced users, is the ability to use color terminals
to show a spectrum of latencies. You'll see a colored output that indicates the
different percentages of samples, and different ASCII characters that indicate
different latency figures. This mode is enabled using the `--latency-dist`
option:

    $ valkey-cli --latency-dist
    (output not displayed, requires a color terminal, try it!)

There is another pretty unusual latency tool implemented inside `valkey-cli`.
It does not check the latency of a Valkey instance, but the latency of the
computer running `valkey-cli`. This latency is intrinsic to the kernel scheduler, 
the hypervisor in case of virtualized instances, and so forth.

Valkey calls it *intrinsic latency* because it's mostly opaque to the programmer.
If the Valkey instance has high latency regardless of all the obvious things
that may be the source cause, it's worth to check what's the best your system
can do by running `valkey-cli` in this special mode directly in the system you
are running Valkey servers on.

By measuring the intrinsic latency, you know that this is the baseline,
and Valkey cannot outdo your system. In order to run the CLI
in this mode, use the `--intrinsic-latency <test-time>`. Note that the test time is in seconds and dictates how long the test should run.

    $ ./valkey-cli --intrinsic-latency 5
    Max latency so far: 1 microseconds.
    Max latency so far: 7 microseconds.
    Max latency so far: 9 microseconds.
    Max latency so far: 11 microseconds.
    Max latency so far: 13 microseconds.
    Max latency so far: 15 microseconds.
    Max latency so far: 34 microseconds.
    Max latency so far: 82 microseconds.
    Max latency so far: 586 microseconds.
    Max latency so far: 739 microseconds.

    65433042 total runs (avg latency: 0.0764 microseconds / 764.14 nanoseconds per run).
    Worst run took 9671x longer than the average latency.

IMPORTANT: this command must be executed on the computer that runs the Valkey server instance, not on a different host. It does not connect to a Valkey instance and performs the test locally.

In the above case, the system cannot do better than 739 microseconds of worst
case latency, so one can expect certain queries to occasionally run less than 1 millisecond.

## Remote backups of RDB files

During a Valkey replication's first synchronization, the primary and the replica
exchange the whole data set in the form of an RDB file. This feature is exploited
by `valkey-cli` in order to provide a remote backup facility that allows a
transfer of an RDB file from any Valkey instance to the local computer running
`valkey-cli`. To use this mode, call the CLI with the `--rdb <dest-filename>`
option:

    $ valkey-cli --rdb /tmp/dump.rdb
    SYNC sent to master, writing 13256 bytes to '/tmp/dump.rdb'
    Transfer finished with success.

This is a simple but effective way to ensure disaster recovery
RDB backups exist of your Valkey instance. When using this options in
scripts or `cron` jobs, make sure to check the return value of the command.
If it is non zero, an error occurred as in the following example:

    $ valkey-cli --rdb /tmp/dump.rdb
    SYNC with master failed: -ERR Can't SYNC while not connected with my master
    $ echo $?
    1

## Replica mode

The replica mode of the CLI is an advanced feature useful for
Valkey developers and for debugging operations.
It allows for the inspection of the content a primary sends to its replicas in the replication
stream in order to propagate the writes to its replicas. The option
name is simply `--replica`. The following is a working example:

    $ valkey-cli --replica
    SYNC with master, discarding 13256 bytes of bulk transfer...
    SYNC done. Logging commands from master.
    "PING"
    "SELECT","0"
    "SET","last_name","Enigk"
    "PING"
    "INCR","mycounter"

The command begins by discarding the RDB file of the first synchronization
and then logs each command received in CSV format.

If you think some of the commands are not replicated correctly in your replicas
this is a good way to check what's happening, and also useful information
in order to improve the bug report.

## Performing an LRU simulation

Valkey is often used as a cache with [LRU eviction](lru-cache.md).
Depending on the number of keys and the amount of memory allocated for the
cache (specified via the `maxmemory` directive), the amount of cache hits
and misses will change. Sometimes, simulating the rate of hits is very
useful to correctly provision your cache.

The `valkey-cli` has a special mode where it performs a simulation of GET and SET
operations, using an 80-20% power law distribution in the requests pattern.
This means that 20% of keys will be requested 80% of times, which is a
common distribution in caching scenarios.

Theoretically, given the distribution of the requests and the Valkey memory
overhead, it should be possible to compute the hit rate analytically
with a mathematical formula. However, Valkey can be configured with
different LRU settings (number of samples) and LRU's implementation, which
is approximated in Valkey, changes a lot between different versions. Similarly
the amount of memory per key may change between versions. That is why this
tool was built: its main motivation was for testing the quality of Valkey' LRU
implementation, but now is also useful for testing how a given version
behaves with the settings originally intended for deployment.

To use this mode, specify the amount of keys in the test and configure a sensible `maxmemory` setting as a first attempt.

IMPORTANT NOTE: Configuring the `maxmemory` setting in the Valkey configuration
is crucial: if there is no cap to the maximum memory usage, the hit will
eventually be 100% since all the keys can be stored in memory. If too many keys are specified with maximum memory, eventually all of the computer RAM will be used. It is also needed to configure an appropriate
*maxmemory policy*; most of the time `allkeys-lru` is selected.

In the following example there is a configured a memory limit of 100MB and an LRU
simulation using 10 million keys.

WARNING: the test uses pipelining and will stress the server, don't use it
with production instances.

    $ ./valkey-cli --lru-test 10000000
    156000 Gets/sec | Hits: 4552 (2.92%) | Misses: 151448 (97.08%)
    153750 Gets/sec | Hits: 12906 (8.39%) | Misses: 140844 (91.61%)
    159250 Gets/sec | Hits: 21811 (13.70%) | Misses: 137439 (86.30%)
    151000 Gets/sec | Hits: 27615 (18.29%) | Misses: 123385 (81.71%)
    145000 Gets/sec | Hits: 32791 (22.61%) | Misses: 112209 (77.39%)
    157750 Gets/sec | Hits: 42178 (26.74%) | Misses: 115572 (73.26%)
    154500 Gets/sec | Hits: 47418 (30.69%) | Misses: 107082 (69.31%)
    151250 Gets/sec | Hits: 51636 (34.14%) | Misses: 99614 (65.86%)

The program shows stats every second. In the first seconds the cache starts to be populated. The misses rate later stabilizes into the actual figure that can be expected:

    120750 Gets/sec | Hits: 48774 (40.39%) | Misses: 71976 (59.61%)
    122500 Gets/sec | Hits: 49052 (40.04%) | Misses: 73448 (59.96%)
    127000 Gets/sec | Hits: 50870 (40.06%) | Misses: 76130 (59.94%)
    124250 Gets/sec | Hits: 50147 (40.36%) | Misses: 74103 (59.64%)

A miss rate of 59% may not be acceptable for certain use cases therefor
100MB of memory is not enough. Observe an example using a half gigabyte of memory. After several
minutes the output stabilizes to the following figures:

    140000 Gets/sec | Hits: 135376 (96.70%) | Misses: 4624 (3.30%)
    141250 Gets/sec | Hits: 136523 (96.65%) | Misses: 4727 (3.35%)
    140250 Gets/sec | Hits: 135457 (96.58%) | Misses: 4793 (3.42%)
    140500 Gets/sec | Hits: 135947 (96.76%) | Misses: 4553 (3.24%)

With 500MB there is sufficient space for the key quantity (10 million) and distribution (80-20 style).
