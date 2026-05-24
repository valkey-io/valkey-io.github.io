---
title: "Configuration"
description: >
    Overview of valkey.conf, the Valkey configuration file

---

Valkey is able to start without a configuration file using a built-in default
configuration, however this setup is only recommended for testing and
development purposes.

The proper way to configure Valkey is by providing a Valkey configuration file,
usually called `valkey.conf`.

The `valkey.conf` file contains a number of directives that have a very simple
format:

    keyword argument1 argument2 ... argumentN

This is an example of a configuration directive:

    replicaof 127.0.0.1 6380

It is possible to provide strings containing spaces as arguments using
(double or single) quotes, as in the following example:

    requirepass "hello world"

Single-quoted string can contain characters escaped by backslashes, and
double-quoted strings can additionally include any ASCII symbols encoded using
backslashed hexadecimal notation "\\xff".

The list of configuration directives, and their meaning and intended usage
is available in the self documented example valkey.conf shipped into the
Valkey distribution.

* The self documented [valkey.conf for Valkey 9.0](https://raw.githubusercontent.com/valkey-io/valkey/9.0/valkey.conf).
* The self documented [valkey.conf for Valkey 8.1](https://raw.githubusercontent.com/valkey-io/valkey/8.1/valkey.conf).
* The self documented [valkey.conf for Valkey 8.0](https://raw.githubusercontent.com/valkey-io/valkey/8.0/valkey.conf).
* The self documented [valkey.conf for Valkey 7.2](https://raw.githubusercontent.com/valkey-io/valkey/7.2/valkey.conf).
* The self documented [redis.conf for Redis OSS 7.2](https://raw.githubusercontent.com/redis/redis/7.2/redis.conf).
* The self documented [redis.conf for Redis OSS 7.0](https://raw.githubusercontent.com/redis/redis/7.0/redis.conf).
* The self documented [redis.conf for Redis OSS 6.2](https://raw.githubusercontent.com/redis/redis/6.2/redis.conf).

Passing arguments via the command line
---

You can also pass Valkey configuration parameters
using the command line directly. This is very useful for testing purposes.
The following is an example that starts a new Valkey instance using port 6380
as a replica of the instance running at 127.0.0.1 port 6379.

    ./valkey-server --port 6380 --replicaof 127.0.0.1 6379

The format of the arguments passed via the command line is exactly the same
as the one used in the valkey.conf file, with the exception that the keyword
is prefixed with `--`.

Note that internally this generates an in-memory temporary config file
(possibly concatenating the config file passed by the user, if any) where
arguments are translated into the format of valkey.conf.

Changing Valkey configuration while the server is running
---

It is possible to reconfigure Valkey on the fly without stopping and restarting
the service, or querying the current configuration programmatically using the
special commands `CONFIG SET` and `CONFIG GET`.

Not all of the configuration directives are supported in this way, but most
are supported as expected.
Please refer to the `CONFIG SET` and `CONFIG GET` pages for more information.

Note that modifying the configuration on the fly **has no effects on the
valkey.conf file** so at the next restart of Valkey the old configuration will
be used instead.

Make sure to also modify the `valkey.conf` file accordingly to the configuration
you set using `CONFIG SET`.
You can do it manually, or you can use `CONFIG REWRITE`, which will automatically scan your `valkey.conf` file and update the fields which don't match the current configuration value.
Fields non existing but set to the default value are not added.
Comments inside your configuration file are retained.

Configuring Valkey as a cache
---

If you plan to use Valkey as a cache where every key will have an
expire set, you may consider using the following configuration instead
(assuming a max memory limit of 2 megabytes as an example):

    maxmemory 2mb
    maxmemory-policy allkeys-lru

In this configuration there is no need for the application to set a
time to live for keys using the `EXPIRE` command (or equivalent) since
all the keys will be evicted using an approximated LRU algorithm as long
as we hit the 2 megabyte memory limit.

Basically, in this configuration Valkey acts in a similar way to memcached.
We have more extensive documentation about using Valkey as an LRU cache [here](lru-cache.md).
