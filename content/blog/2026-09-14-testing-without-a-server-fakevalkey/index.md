+++
title = "Testing without a server: inside FakeValkey, the in-memory test double for Valkey"
date = 2026-09-14
description = "FakeValkey runs the Valkey command set inside your Python test process, with no server, container, or network connection. Here is how to use it, how it keeps pace with Valkey, and when you still need a real server."
authors = ["cunla"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/blog/testing-without-a-server-fakevalkey/images/hero.svg"
og_image = "/blog/testing-without-a-server-fakevalkey/images/og.png"
+++

Every application that talks to Valkey has to answer the same question in its test suite: where does the server come from?
You can start a real `valkey-server` in continuous integration (CI), which is accurate but adds a container, a port, and startup time to every run.
You can mock the client, which is fast, but a mock only knows what you told it, so it drifts from the server without failing a single test.
A test double sits between the two: an implementation of the server's behavior that runs inside the test process.

I maintain [fakeredis](https://github.com/cunla/fakeredis-py), a pure-Python, in-memory implementation of the Valkey command set that plugs into [valkey-py](https://github.com/valkey-io/valkey-py) as a client class. It has 40m downloads/month (September 2026). 
This post covers its `FakeValkey` class: how to use it, how it keeps pace with Valkey, where matching Valkey's behavior gets hard, how to check a Redis to Valkey migration with it, and when you should use a real server instead.

## Replacing a Valkey client with FakeValkey

Install fakeredis with the `valkey` extra, which pulls in valkey-py:

```bash
pip install "fakeredis[valkey]"
```

`FakeValkey` is a subclass of `valkey.Valkey`, so any code that accepts a Valkey client accepts it.
Commands never leave the process: there is no network connection, and the data lives in Python objects.

```python
from fakeredis import FakeValkey

client = FakeValkey()
client.set("greeting", "hello")
client.get("greeting")  # b'hello'
```

`FakeAsyncValkey` does the same for `valkey.asyncio.Valkey`.
The examples in this post use fakeredis 2.38.0 and valkey-py 6.1.1 on Python 3.14.

## Using FakeValkey in a pytest suite

Here is a login rate limiter that allows five attempts per user per minute:

```python
def allow_login(client, user_id, limit=5, window=60):
    key = f"login:{user_id}"
    attempts = client.incr(key)
    if attempts == 1:
        client.expire(key, window)
    return attempts <= limit
```

The test passes a `FakeValkey` where production code passes a real client:

```python
import fakeredis
import pytest

from ratelimit import allow_login


@pytest.fixture
def valkey_client():
    return fakeredis.FakeValkey()


def test_blocks_the_sixth_attempt(valkey_client):
    for _ in range(5):
        assert allow_login(valkey_client, "alice")
    assert not allow_login(valkey_client, "alice")
    assert valkey_client.ttl("login:alice") == 60


def test_each_test_starts_empty(valkey_client):
    assert valkey_client.get("login:alice") is None
```

pytest reports 0.09 seconds for both tests on an arm64 Linux virtual machine.
Each `FakeValkey` instance gets its own in-memory server, so the second test sees none of the keys the first test wrote.

When two clients need to see the same data, such as a web handler and a background worker, give them one `FakeServer`:

```python
from fakeredis import FakeServer, FakeValkey

server = FakeServer(server_type="valkey")
web = FakeValkey(server=server)
worker = FakeValkey(server=server)
web.set("job:42", "queued")
worker.get("job:42")  # b'queued'
```

If the code under test opens its own connection from a host and port, [`TcpFakeServer`](https://github.com/cunla/fakeredis-py/blob/v2.38.0/docs/valkey-support.md) serves the same fake over TCP.

## How FakeValkey maintains compatibility with Valkey

FakeValkey is only useful while it behaves like the server, and Valkey keeps shipping.
fakeredis checks itself by running its test suite twice: the client fixture that every test takes is [parametrized](https://github.com/cunla/fakeredis-py/blob/v2.38.0/test/conftest.py#L182-L187) to yield both a fake client and a client connected to a real server, over protocol versions 2 and 3.
When the real server is Valkey, the fixtures select `FakeValkey` and `valkey.Valkey`, so the same assertion runs against both.
The [CI matrix](https://github.com/cunla/fakeredis-py/blob/v2.38.0/.github/workflows/test.yml#L41-L45) runs that suite against the `valkey/valkey:9.1` and `valkey/valkey:8.1.8` images.
A test that applies to some versions only carries a marker such as `@pytest.mark.supported_server_versions(min_valkey_ver="9")`.

Seen this way, the suite is an executable specification of observed Valkey behavior.
A test that passes against Valkey and fails against the fake is a bug report against fakeredis with the reproduction already attached.

## Where matching Valkey gets hard

The documented behavior of a command is the part you can implement from the docs.
The hard part is behavior that tests depend on without anyone writing it down.
Three examples from recent releases:

- **Lua globals.** Valkey scripts can call `server.call()` as well as `redis.call()`, because Valkey 9.1.2 [registers a `server` global](https://github.com/valkey-io/valkey/blob/9.1.2/src/modules/lua/engine_lua.c#L113-L133).
  Under fakeredis, a script written that way failed with `attempt to index global 'server' (a nil value)` until [Przemysław Buczkowski](https://github.com/przemub) added the alias in [fakeredis 2.36.0](https://github.com/cunla/fakeredis-py/pull/480).
- **Error text.** Valkey 9.1.2 rejects a Lua table passed as a command argument with [`Command arguments must be strings or integers`](https://github.com/valkey-io/valkey/blob/9.1.2/src/modules/lua/script_lua.c#L729), while Valkey 7.2.4, the first Valkey release, [used `Lua redis lib command arguments must be strings or integers`](https://github.com/valkey-io/valkey/blob/7.2.4/src/script_lua.c#L851).
  A test that asserts on the message passes only if the fake uses the same wording, so fakeredis [picks the message by `server_type`](https://github.com/cunla/fakeredis-py/blob/v2.38.0/fakeredis/commands_mixins/scripting_mixin.py#L530-L536).
- **Exception classes.** Code written against valkey-py catches `valkey.ResponseError`, which is a different class from the one redis-py raises.
  Until [fakeredis 2.31.0](https://github.com/cunla/fakeredis-py/issues/402), `FakeValkey` raised the redis-py class, so an `except valkey.ResponseError` block in the code under test never ran.

Today Valkey is a first-class target in the test suite.
The fixtures read the `valkey_version` field that Valkey reports and gate tests on it, rather than on the Redis-compatible `redis_version` that Valkey also reports.

## Checking a Redis to Valkey migration with fakeredis

fakeredis emulates Redis and Valkey behind one client interface, so you can run your existing tests against Valkey's behavior before you change any infrastructure.
Parametrize the client fixture your tests already use:

```python
import fakeredis
import pytest


@pytest.fixture(params=["redis", "valkey-server", "valkey-client"])
def client(request):
    if request.param == "redis":
        return fakeredis.FakeRedis(version=(8, 8))  # the Redis version you run today
    if request.param == "valkey-server":
        return fakeredis.FakeRedis(server_type="valkey")
    return fakeredis.FakeValkey()
```

Each test now runs three times, and each variant checks one migration step:

- `redis` is the baseline: redis-py against the Redis version you run today.
- `valkey-server` keeps redis-py and switches to Valkey server behavior, as when you point your current client at a Valkey server.
- `valkey-client` also replaces redis-py with valkey-py.

Here is code that calls the `INCREX` command, which exists in Redis 8.8 but not in Valkey.
Running its test against the three variants shows which migration step breaks it.

```python
def count_request(client, user_id):
    value, _ = client.increx(f"requests:{user_id}", ex=60, enx=True)
    return value


def test_count_request_sets_the_window_once(client):
    assert count_request(client, "alice") == 1
    assert count_request(client, "alice") == 2
    assert client.ttl("requests:alice") == 60
```

This test passes on `redis`.
On `valkey-server` the server replies `unknown command 'increx'`, and on `valkey-client` valkey-py has no `increx()` method.

## When to use a fake and when to use a real server

Use `FakeValkey` for tests of application logic: code that reads and writes keys, sets expirations, and runs transactions, scripts, and pub/sub, where each test should start empty and finish in milliseconds.
The [supported commands docs](https://github.com/cunla/fakeredis-py/tree/v2.38.0/docs/supported-commands) also cover JavaScript Object Notation (JSON), Bloom filter, and time series commands.

Use a real server for the rest:

- **Commands the fake does not implement.** The docs mark each one, for example [`INFO` and `LATENCY`](https://github.com/cunla/fakeredis-py/blob/v2.38.0/docs/supported-commands/Redis/SERVER.md#L171-L177), so `client.info()` against `FakeValkey` raises `unknown command 'info'`.
- **Behavior that needs more than one node**, such as replication, failover, and cluster mode.
  fakeredis runs a single in-process server, and the docs mark the [cluster commands](https://github.com/cunla/fakeredis-py/blob/v2.38.0/docs/supported-commands/Redis/CLUSTER.md) as not implemented.
- **Latency and memory usage.** The fake stores data in Python objects, not in Valkey's data structures, so its numbers say nothing about your server.

The split I recommend is fakes in unit tests on every commit, plus a smaller set of integration tests against the Valkey version you run in production.

## Contributing command coverage

Each command in fakeredis is one method plus its tests, which makes command coverage a contained first contribution to the Valkey ecosystem.
Pick a command marked "(not implemented)" in the [supported commands docs](https://github.com/cunla/fakeredis-py/tree/v2.38.0/docs/supported-commands), implement it in the matching mixin under `fakeredis/commands_mixins/`, and add tests that pass against both the fake and a real Valkey server.
If you find a place where `FakeValkey` and Valkey disagree, [open an issue](https://github.com/cunla/fakeredis-py/issues) with the command and your Valkey version; a failing comparison is the most useful kind of bug report I get.

## Try FakeValkey on your own test suite

A mock checks your code against the replies you wrote into it.
`FakeValkey` checks it against an implementation of the Valkey command set, and the fakeredis CI matrix compares that implementation with real Valkey 8.1.8 and 9.1 servers.

To see what that difference catches in your project, replace one mocked client with a `FakeValkey` instance and run your tests.
A test that starts failing has found one of three things: a reply the mock made up, a bug the mock was hiding, or a command the fake does not implement yet.
The first two are worth fixing in your code; the third is a contained first pull request to fakeredis.
