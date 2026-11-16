+++
title = "Managing TLS certificates in Valkey 9.1 and 9.2"
date = 2026-11-30
description = "A renewed certificate on disk doesn't help if the server never loads it. Valkey 9.1 and 9.2 can reload certificates automatically, report their expiry, authenticate clients by SAN URI, and serve a second certificate."
authors = ["dragosandriciuc","pkhartsk"]
draft = true
[taxonomies]
blog_type = ["How-to"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-02.webp"
+++

Imagine you're hired as a new operator and your first task is to run a Valkey deployment that already uses TLS.
On your first day, the clients start failing their TLS handshakes because the server certificate expired overnight.
The renewed certificate is already on disk, but Valkey is still serving the old one, and nobody was tracking the expiry date.
Before Valkey 9.1, you had to fix this by hand by running the `CONFIG SET tls-cert-file` command to make the server load the files again, or restart it.

With Valkey 9.1 and 9.2, four TLS improvements are brought in: automatic certificate reload, certificate expiry reporting, client authentication by certificate URI, and a second server certificate.
This post shows how you can use each one of these options.
If you haven't set up TLS yet, start by reading the [TLS documentation](https://valkey.io/topics/tls/).
The examples used ran on Valkey 9.2.0-rc2 built with OpenSSL 3.5.4.
The certificates are test files created with `openssl`: a certificate authority (CA), an RSA server certificate that expires in one day and its 90-day renewal, a client certificate, and an ML-DSA-65 server certificate.

## Automatic certificate reloading

You check and see that Valkey keeps using the certificate it loaded at startup and waits for you to explicitly reload the TLS materials.
You can trigger a reload by running the `CONFIG SET tls-cert-file` command with the configured path again, or by restarting the server, but this becomes tedious.

Valkey 9.1 now allows you to reload certificates [automatically](https://github.com/valkey-io/valkey/pull/3020), implemented by [Yang Zhao](https://github.com/yang-z-o).
This feature uses the newly added `tls-auto-reload-interval` option to check the provided certificate and key files on a schedule and reloads them when it notices a change.
The feature is turned off by default (`0`), so make sure to set it to the number of seconds you need between checks.
For example, the sample `valkey.conf` that ships with Valkey uses `86400` seconds or one day.

To watch it work, start a server that checks every 5 seconds:

1. Create a `valkey.conf` file:

    ```text
    port 0
    tls-port 6379
    tls-cert-file server.crt
    tls-key-file server.key
    tls-ca-cert-file ca.crt
    tls-auth-clients optional
    tls-auto-reload-interval 5
    logfile valkey.log
    daemonize yes
    ```

    The `tls-auth-clients optional` line lets clients connect without a certificate (the commands in this post rely on it).

2. Start the server and check the certificate it serves:

    ```bash
    valkey-server valkey.conf
    valkey-cli --tls --cacert ca.crt INFO tls | grep tls_server_cert
    ```

    ```text
    tls_server_cert_serial:04D6326AC9A0E228994D8AEA737EAA61A68B064C
    tls_server_cert_expires_in_seconds:86398
    ```

3. Now replace the certificate file with the renewed one:

    ```bash
    cp server-renewed.crt server.crt
    ```

    Now, within the next interval, the server log reports `TLS materials changed, reloading in background`, then `TLS materials reloaded successfully`.
    If you use `INFO tls` it now reports the serial of the renewed certificate, which differs in the last digit:

    ```text
    tls_server_cert_serial:04D6326AC9A0E228994D8AEA737EAA61A68B064D
    ```

Valkey checks the certificate files using their SHA-256 fingerprints, so a certificate file triggers a reload only when its contents change.
Key files on the other hand are checked using their index node (inode) and modification time.
When Valkey detects a change, it loads the new files on a background thread, and the main thread switches to them only after they load successfully.

A change is picked up at the next check, so it can take up to `tls-auto-reload-interval` seconds to take effect.
If you replace both the certificate and the key, make sure you deploy them as a matching pair.
If Valkey checks the files between the two updates, then the reload fails with a key mismatch error, Valkey keeps the current certificate, and the next check retries.

However, the automatic reload feature only helps if a valid certificate reaches the disk.
Valkey 9.1 loads a certificate that has already expired, and clients then fail certificate verification, so you still need to check how long that certificate has left.
Valkey 9.2 now rejects a new certificate that has already expired, logs it as `Background TLS reload failed`, and keeps serving the current one.

## Checking certificate expiry

Now that Valkey reloads a renewed certificate on its own, you need to monitor the certificate expiry so a certificate doesn't run out without anyone noticing.
Since Valkey 9.1, `INFO` [reports](https://github.com/valkey-io/valkey/pull/2913) the serial number and remaining validity of each configured TLS certificate, implemented by [Yiwen Zhang](https://github.com/YiwenZhang12).

These fields are in their own `INFO tls` section though, which plain `INFO` doesn't show, so make sure to ask for it by name:

```bash
valkey-cli --tls --cacert ca.crt INFO tls
```

```text
# TLS
tls_server_cert_serial:04D6326AC9A0E228994D8AEA737EAA61A68B064D
tls_server_cert_expires_in_seconds:7775991
tls_server_alt_cert_serial:none
tls_server_alt_cert_expires_in_seconds:0
tls_client_cert_serial:none
tls_client_cert_expires_in_seconds:0
tls_ca_cert_serial:1B755D4384E0F108CC146C9480C8F61323CD5D53
tls_ca_cert_expires_in_seconds:31535991
```

Where:

- `tls_server_cert` is the certificate Valkey presents to the clients, and `tls_ca_cert` is the CA it uses to verify them.
- `tls_client_cert` is the certificate Valkey presents on its own outgoing connections, set with `tls-client-cert-file`, **not** the certificate of a connected client.
- `tls_server_alt_cert` is the second server certificate, new in Valkey 9.2 and covered later.

A value of `0` means that either the certificate isn't configured yet or that it has already expired.
The matching `_serial` field tells them apart: `none` means nothing is configured.

Knowing the above fields, you can now feed `tls_server_cert_expires_in_seconds` into your monitoring and set up an alert when it drops below the time your renewal process needs.
You can also apply the same monitoring to `tls_ca_cert_expires_in_seconds` to track the CA certificate expiration.

## Authenticating clients by certificate

With the server certificate reloading and monitored, the next task is to manage the passwords your applications log in with.
However, instead of managing the passwords for each individual application, Valkey allows you to authenticate clients against identities in their certificates.

In Valkey 9.0 you can [map](https://github.com/valkey-io/valkey/pull/1920) the certificate's Common Name (CN) to an ACL user, implemented by [Omkar Mestry](https://github.com/omanges).
Valkey 9.1 builds on this and [adds](https://github.com/valkey-io/valkey/pull/3078) `URI`, which uses the URI entries in the certificate's Subject Alternative Name (SAN) instead, for deployments where the CN is empty or deprecated, also implemented by [Yang Zhao](https://github.com/yang-z-o).
For example, this client certificate carries two URIs:

```bash
openssl x509 -in client.crt -noout -ext subjectAltName
```

```text
X509v3 Subject Alternative Name:
    URI:urn:valkey:user:first, URI:urn:valkey:user:second
```

1. You can add the URI mode and an ACL user named after the first URI to `valkey.conf`, then restart the server:

    ```text
    tls-auth-clients-user URI
    user urn:valkey:user:first on ~orders:* +@read +@write +acl|whoami
    ```

Now the new user has no password, as `valkey.conf` recommends, so the certificate is the only way to authenticate as it.
To apply the same change to a running server, use the `CONFIG SET tls-auth-clients-user URI` and `ACL SETUSER` commands, then use the `CONFIG REWRITE` command to save both to `valkey.conf`.
If you are using an external ACL file, use the `ACL SAVE` command.

2. After the server is restarted, connect with the client certificate:

    ```bash
    valkey-cli --tls --cacert ca.crt --cert client.crt --key client.key ACL WHOAMI
    ```

    ```text
    urn:valkey:user:first
    ```

Here the user's ACL rules apply as usual: `SET orders:1 pending` returns `OK`, and `SET users:1 x` returns `NOPERM No permissions to access a key`.
When a certificate carries several URIs, Valkey checks them in the order they appear and uses the first one that matches an enabled user.

Valkey first validates the client certificate against its trusted CA, and then uses the SAN URI to find the matching ACL user.

However, if no URI in the certificate matches an enabled user, then the handshake still succeeds and the connection becomes the `default` user.
Valkey then counts these in `acl_access_denied_tls_cert` under `INFO stats` and logs `TLS: No matching user found in certificate SAN URI fields` at the `verbose` level.
You can disable the `default` user by using the `ACL SETUSER default off` command, to make sure that an unmatched certificate gets no access.
The same client then gets a `NOAUTH Authentication required.` error.
And this also applies to clients that don't present certificates.

You must create a user with administrative access before you do this, because connections that don't authenticate, including the `valkey-cli` commands in this post, get the same error.

## Serving a second certificate

If some of your clients can't use your main certificate, Valkey 9.2 now allows you to load a [second](https://github.com/valkey-io/valkey/pull/3717) server certificate, implemented by [Petr Khartskhaev](https://github.com/pkhartsk).
The example in the linked PR is a migration to post-quantum cryptography (PQC): you serve a post-quantum certificate to clients that support it, and an RSA certificate to clients that don't support PQC.

To do this, you must:

1. Set the post-quantum certificate as the main certificate and the RSA certificate as the secondary certificate (alternative) in `valkey.conf`:

    ```text
    tls-cert-file server-mldsa.crt
    tls-key-file server-mldsa.key
    tls-alt-cert-file server.crt
    tls-alt-key-file server.key
    ```

Where:

- `server.crt` and `server.key` are the renewed RSA certificate and its key from the first section.
- `server-mldsa.crt` uses the ML-DSA-65 signature algorithm, and this example runs Valkey built against OpenSSL 3.5.4.
- `tls-alt-cert-file` and `tls-alt-key-file` must be set together.

However, the order in the configuration doesn't decide which certificate is used.
The handshake does: it picks it from the signature algorithms both sides support, and `tls-prefer-server-ciphers` (default `no`) decides whose preference order wins.

2. A client built with OpenSSL 3.5.4 gets the ML-DSA certificate:

    ```bash
    openssl s_client -connect 127.0.0.1:6379 -CAfile ca.crt </dev/null 2>&1 | grep -E '^subject=|Peer signature type'
    ```

    ```text
    subject=O=Valkey TLS lab, CN=server-mldsa
    Peer signature type: mldsa65
    ```

The same command from a client built with OpenSSL 3.0.13, which has no ML-DSA support, gets the RSA certificate without any change on its side:

```text
subject=O = Valkey TLS lab, CN = server-renewed
Peer signature type: RSA-PSS
```

And `INFO tls` reports the second certificate's serial and expiry next to the main certificate:

```text
tls_server_cert_serial:04D6326AC9A0E228994D8AEA737EAA61A68B064F
tls_server_cert_expires_in_seconds:7774310
tls_server_alt_cert_serial:04D6326AC9A0E228994D8AEA737EAA61A68B064D
tls_server_alt_cert_expires_in_seconds:7774309
```

And automatic reload watches the alternative files too, so you can renew each certificate on its own schedule.
You can also add `tls_server_alt_cert_expires_in_seconds` to the same monitoring as the main certificate.

## Try it on your own certificates

You can try it by starting with one server: set `tls-auto-reload-interval`, and add `tls_server_cert_expires_in_seconds` from `INFO tls` to your monitoring.
The [TLS documentation](https://valkey.io/topics/tls/) covers the rest of the TLS setup.

If something behaves differently from what this post describes, open an issue in [valkey-io/valkey](https://github.com/valkey-io/valkey/issues) with your Valkey and OpenSSL versions.
If you want to talk through your own certificate setup, ask in [Slack](https://valkey.io/slack) or start a thread in [GitHub Discussions](https://github.com/orgs/valkey-io/discussions).
You can also check out our [Valkey community events](https://valkey.io/events/).
