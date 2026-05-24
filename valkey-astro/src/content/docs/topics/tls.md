---
title: "TLS"
description: Valkey TLS support
---

SSL/TLS is supported by Valkey as an optional feature
that needs to be enabled at compile time. See the 
[Valkey build guide](https://github.com/valkey-io/valkey#building-valkey-using-makefile) 
for more details.

## Getting Started

### Quick start

To start a TLS-enabled Valkey server:

    ./src/valkey-server \
        --tls-port 6379 --port 0 \
        --tls-cert-file /path/to/server.crt \
        --tls-key-file /path/to/server.key \
        --tls-ca-cert-file /path/to/ca.crt

To connect to this TLS-enabled Valkey server with `valkey-cli`:

    ./src/valkey-cli --tls \
        --cert /path/to/client.crt \
        --key /path/to/client.key \
        --cacert /path/to/ca.crt

### TLS listening port

The `tls-port` configuration directive enables accepting SSL/TLS connections on
the specified port. This is **in addition** to listening on `port` for TCP
connections, so it is possible to access Valkey on different ports using TLS and
non-TLS connections simultaneously.

You may specify `port 0` to disable the non-TLS port completely. To enable only
TLS on the default Valkey port, use:

```
port 0
tls-port 6379
```

### TLS material configuration

To enable TLS, Valkey must be configured with the appropriate X.509
certificates and private keys.

**Server certificate and key**

When acting as a TLS server, Valkey requires a server certificate and
private key, configured using:

```
tls-cert-file /path/to/valkey.crt
tls-key-file /path/to/valkey.key
```

**CA certificate configuration**

A trusted Certificate Authority (CA) must be configured in order to
validate peer certificates. This can be done by specifying either a CA
certificate bundle file or a directory containing CA certificates:

```
tls-ca-cert-file /path/to/ca.crt
tls-ca-cert-dir /path/to/ca-certs/
```

**Client certificate and key (mutual TLS)**

When mutual TLS (mTLS) is enabled, Valkey can be configured with a client
certificate and private key to authenticate itself to connecting peers:

```
tls-client-cert-file /path/to/client.crt
tls-client-key-file /path/to/client.key
```

**Automatic TLS material reload**

Valkey can automatically reload TLS materials at a specified interval
(in seconds), the default value is 0 (disabled). Reloading is performed in a background
thread, so it does not block the main server thread. For example, to reload materials daily:

```
tls-auto-reload-interval 86400
```

**TLS material validation**

Valkey performs validation on all TLS materials whenever they are loaded
or reloaded. If any check fails, the load operation will fail immediately,
preventing Valkey from using invalid TLS materials.

The validation ensures that:

- TLS files or directories are not empty or malformed
- Certificates match their corresponding private keys
- Certificates are within their valid time period

### Client certificate authentication

By default, Valkey uses mutual TLS and requires clients to present a
valid certificate verified against trusted root CAs configured via
`tls-ca-cert-file` or `tls-ca-cert-dir`. You may use `tls-auth-clients no` 
to disable client authentication.

The verification of client certificates doesn't by default authenticate the 
client as a user. It only controls whether the client can connect or not. 
The client can use the `AUTH` or the `HELLO` command to authenticate using 
username and password after connecting.

To let clients authenticate as a user with one of the identities in the client 
certificate, configure `tls-auth-clients-user`.
When enabled, Valkey automatically authenticates TLS clients as Valkey ACL users
by extracting a field from the client certificate and looking up a matching user.
If no match is found, the client remains as the default user.
When using this feature, it is recommended to configure users without passwords 
so that authentication is enforced exclusively through mTLS certificates:
```
ACL SETUSER client-user on allcommands allkeys
```

### Replication

A Valkey primary server handles connecting clients and replica servers in the same
way, so the above `tls-port` and `tls-auth-clients` directives apply to
replication links as well.

On the replica server side, it is necessary to specify `tls-replication yes` to
use TLS for outgoing connections to the primary.

### Cluster

When Valkey Cluster is used, use `tls-cluster yes` in order to enable TLS for the
cluster bus and cross-node connections.

### Sentinel

Sentinel inherits its networking configuration from the common Valkey
configuration, so all of the above applies to Sentinel as well.

When connecting to primary servers, Sentinel will use the `tls-replication`
directive to determine if a TLS or non-TLS connection is required.

In addition, the very same `tls-replication` directive will determine whether Sentinel's
port, that accepts connections from other Sentinels, will support TLS as well. That is,
Sentinel will be configured with `tls-port` if and only if `tls-replication` is enabled. 

### Additional configuration

Additional TLS configuration is available to control the choice of TLS protocol
versions, ciphers and cipher suites, etc. Please consult the self documented
`valkey.conf` for more information.

### Performance considerations

TLS adds a layer to the communication stack with overheads due to writing/reading to/from an SSL connection, encryption/decryption and integrity checks. Consequently, using TLS results in a decrease of the achievable throughput per Valkey instance.
