---
title: "The Valkey server"
description: >
    Manual for valkey-server, the Valkey server program
---

## Usage

**`valkey-server`** [ _/path/to/valkey.conf_ ] [ _OPTIONS_ ] [**`-`**]\
**`valkey-server`** **`-v`** | **`--version`**\
**`valkey-server`** **`-h`** | **`--help`**\
**`valkey-server`** **`--test-memory`** _megabytes_\
**`valkey-server`** **`--check-system`**

## Description

`valkey-server` is the Valkey database program.

What is Valkey? See [Introduction](introduction.md).

## Options

The configuration file and the configuration directives are documented in
[Configuration](valkey.conf.md). Use `-` to read configuration from stdin.

Each of the configuration directives can be provided on the command line
with its name prefixed by two dashes. For example, `--port 6380` on the command
line is equivalent to `port 6380` in the config file.

Additional options:

**`-v`**, **`--version`**
: Output version and exit.

**`-h`**, **`--help`**
: Output help and exit.

**`--test-memory`** _megabytes_
: Run a memory test and exit.

**`--check-system`**
: Output some operating system properties relevant for running Valkey and exit.

**`--sentinel`**
: Start in [sentinel](sentinel.md) mode

## Examples

Run the server with default config:

    valkey-server

Read configuration from stdin:

    echo 'maxmemory 128mb' | valkey-server -

Start with a configuration file:

    valkey-server /etc/valkey/6379.conf

Start with configuration as command line options:

    valkey-server --port 7777

Start as a replica of another Valkey server that can accessed at 127.0.0.1:8888:

    valkey-server --port 7777 --replicaof 127.0.0.1 8888

Start with a config file, then some additional options overriding the ones in
the config file, and finally some more options from stdin:

    valkey-server /etc/myvalkey.conf --loglevel verbose -

Start with a config file and some additional options overriding the ones in
the config file:

    valkey-server /etc/myvalkey.conf --loglevel verbose

## See also

[Valkey documentation](index.md), [Introduction](introduction.md), [Configuration](valkey.conf.md), [Installation](installation.md), [valkey-cli](cli.md)
