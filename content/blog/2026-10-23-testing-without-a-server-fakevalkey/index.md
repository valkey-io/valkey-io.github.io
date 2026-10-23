+++
title = "Testing without a server: using FakeValkey, the in-memory test double for Valkey"
date = 2026-10-26
draft = true
description = """FakeValkey runs the Valkey command set inside your Python test process, with no server, container, or network connection.
Here is how to use it, how it keeps pace with Valkey, and when you still need a real server."""
authors = ["cunla"]

[taxonomies]
blog_type = ["How-to"]

[extra]
featured = false
featured_image = "/blog/testing-without-a-server-fakevalkey/images/hero.svg"
og_image = "/blog/testing-without-a-server-fakevalkey/images/og.png"
+++

Every application that talks to Valkey has to answer the same question in its test suite: where does the server come from?
You can start a real `valkey-server` in continuous integration (CI), which is accurate but adds a container, a port, and startup time to every run.
You can mock the client, which is fast, but a mock only knows what you told it, so it drifts from the server without failing a single test.
A test double sits between the two: an implementation of the server's behavior that runs inside the test process.

I maintain [fakeredis](https://github.com/cunla/fakeredis-py), a pure-Python, in-memory implementation of the Valkey command set that plugs into [valkey-py](https://github.com/valkey-io/valkey-py) as a client class.
It has about 40 million [downloads per month](https://pypistats.org/packages/fakeredis) (September 2026).
This post covers its `FakeValkey` class: how to use it, how it keeps pace with Valkey, how to write tests that hold up across Valkey versions, how to check a migration to Valkey with it, and when you should use a real server instead.

## Replacing a Valkey client with FakeValkey

Install the package with the `valkey` extra, which pulls in valkey-py:

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
The examples in this post use version 2.38.0 of the library and valkey-py 6.1.1 on Python 3.14.

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
    assert 0 < valkey_client.ttl("login:alice") <= 60


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
The library checks itself by running its test suite twice: the client fixture that every test takes is [parametrized](https://github.com/cunla/fakeredis-py/blob/v2.38.0/test/conftest.py#L182-L187) to yield both a fake client and a client connected to a real server, over protocol versions 2 and 3.
When the real server is Valkey, the fixtures select `FakeValkey` and `valkey.Valkey`, so the same assertion runs against both.
The [CI matrix](https://github.com/cunla/fakeredis-py/blob/v2.38.0/.github/workflows/test.yml#L41-L45) runs that suite against the `valkey/valkey:9.1` and `valkey/valkey:8.1.8` images.
A test that applies to some versions only carries a marker such as `@pytest.mark.supported_server_versions(min_valkey_ver="9")`.

Seen this way, the suite is an executable specification of observed Valkey behavior.
A test that passes against Valkey and fails against the fake is a bug report against the fake with the reproduction already attached.

## Writing tests that hold up across Valkey versions

Some behavior that tests depend on is not in the command docs, and the fake has had to match it case by case.
Each of these cases suggests a habit for your own tests:

- **Use `server.call()` in new Lua scripts.** Valkey 8.0 [registers `server` as the scripting API and keeps `redis` as an alias](https://github.com/valkey-io/valkey/blob/8.0.0/src/script_lua.c#L1478-L1486), so existing scripts keep working.
  `FakeValkey` supports the `server` global from [version 2.36.0](https://github.com/cunla/fakeredis-py/pull/480), added by [Przemysław Buczkowski](https://github.com/przemub); if a script fails under the fake with `attempt to index global 'server' (a nil value)`, upgrade the library.
- **Assert on the exception class, not the error text.** Messages can change between releases: Valkey 7.2.4 rejects a Lua table passed as a command argument with [`Lua redis lib command arguments must be strings or integers`](https://github.com/valkey-io/valkey/blob/7.2.4/src/script_lua.c#L851), and Valkey 9.1.2 with [`Command arguments must be strings or integers`](https://github.com/valkey-io/valkey/blob/9.1.2/src/modules/lua/script_lua.c#L729).
  The fake [picks the message by `server_type`](https://github.com/cunla/fakeredis-py/blob/v2.38.0/fakeredis/commands_mixins/scripting_mixin.py#L530-L536), but a test that checks only `pytest.raises(valkey.ResponseError)` passes on every version.
- **Catch `valkey.ResponseError` in code written against valkey-py.** It is a different class from the one redis-py raises, and `FakeValkey` raises it from [version 2.31.0](https://github.com/cunla/fakeredis-py/issues/402), so require at least that version if your code has `except valkey.ResponseError` blocks.
- **Gate version-specific integration tests on `valkey_version`.** Valkey also reports a `redis_version` field for compatibility, but it stays at `7.2.4` in every Valkey release, so it cannot tell 8.1 from 9.1; the library's own fixtures read `valkey_version`.

## Checking a migration to Valkey

The library emulates more than one server behind one client interface, so you can run your existing tests against Valkey's behavior before you change any infrastructure.
Parametrize the client fixture your tests already use:

```python
import fakeredis
import pytest


@pytest.fixture(params=["baseline", "valkey-server", "valkey-client"])
def client(request):
    if request.param == "baseline":
        return fakeredis.FakeRedis(version=(8, 8))  # example: use the server version you run today
    if request.param == "valkey-server":
        return fakeredis.FakeRedis(server_type="valkey")
    return fakeredis.FakeValkey()
```

Each test now runs three times, and each variant emulates one migration step in-process; none of them connects to a real server:

- `baseline` is your starting point: your current client against the fake's emulation of the server version you run today.
The example uses 8.8; replace `(8, 8)` with your exact version so the comparison reflects your setup.
- `valkey-server` keeps your current client and switches the fake to Valkey's server behavior, standing in for pointing that client at a Valkey server.
- `valkey-client` also replaces your current client with valkey-py.

These variants tell you where to look before you migrate; confirm the result against a real Valkey server, as described in the next section.

Here is code that calls the `INCREX` command, which the baseline server supports and no generally available Valkey release supports yet.
Valkey 9.2, currently a release candidate, adds its own `INCREX`; fakeredis 2.38.0 does not emulate it for `server_type="valkey"`.
Running its test against the three variants shows which migration step breaks it.

```python
def count_request(client, user_id):
    value, _ = client.increx(f"requests:{user_id}", ex=60, enx=True)
    return value


def test_count_request_sets_the_window_once(client):
    assert count_request(client, "alice") == 1
    assert count_request(client, "alice") == 2
    assert 0 < client.ttl("requests:alice") <= 60
```

This test passes on `baseline`.
On `valkey-server` the fake replies `unknown command 'increx'`, just as a Valkey 9.1 server rejects the unknown command, and on `valkey-client` valkey-py has no `increx()` method.

## When to use a fake and when to use a real server

Use `FakeValkey` for tests of application logic: code that reads and writes keys, sets expirations, and runs transactions, scripts, and pub/sub, where each test should start empty and finish in milliseconds.
The [supported commands docs](https://github.com/cunla/fakeredis-py/tree/v2.38.0/docs/supported-commands) also cover JavaScript Object Notation (JSON), Bloom filter, and time series commands.

Use a real server for the rest:

- **Commands the fake does not implement.** The docs mark each one, for example [`INFO` and `LATENCY`](https://github.com/cunla/fakeredis-py/blob/v2.38.0/docs/supported-commands/Redis/SERVER.md#L171-L177), so `client.info()` against `FakeValkey` raises `unknown command 'info'`.
- **Behavior that needs more than one node**, such as replication, failover, and cluster mode.
  The fake runs a single in-process server, and the docs mark the [cluster commands](https://github.com/cunla/fakeredis-py/blob/v2.38.0/docs/supported-commands/Redis/CLUSTER.md) as not implemented.
- **Latency and memory usage.** The fake stores data in Python objects, not in Valkey's data structures, so its numbers say nothing about your server.

The split I recommend is fakes in unit tests on every commit, plus a smaller set of integration tests against the Valkey version you run in production.

## Contributing command coverage

Each command in the library is one method plus its tests, which makes command coverage a contained first contribution to the Valkey ecosystem.
Pick a command marked "(not implemented)" in the [supported commands docs](https://github.com/cunla/fakeredis-py/tree/v2.38.0/docs/supported-commands), implement it in the matching mixin under `fakeredis/commands_mixins/`, and add tests that pass against both the fake and a real Valkey server.
If you find a place where `FakeValkey` and Valkey disagree, [open an issue](https://github.com/cunla/fakeredis-py/issues) with the command and your Valkey version; a failing comparison is the most useful kind of bug report I get.

## Try FakeValkey on your own test suite

A mock checks your code against the replies you wrote into it.
`FakeValkey` checks it against an implementation of the Valkey command set, and the project's CI matrix compares that implementation with real Valkey 8.1.8 and 9.1 servers.

To see what that difference catches in your project, replace one mocked client with a `FakeValkey` instance and run your tests.
A test that starts failing has found one of three things: a reply the mock made up, a bug the mock was hiding, or a command the fake does not implement yet.
The first two are worth fixing in your code; the third is a contained first pull request to the project.
