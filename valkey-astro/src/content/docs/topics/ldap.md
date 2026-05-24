---
title: "LDAP Authentication"
description: >
    Introduction to LDAP / Active Directory Authentication
---

Valkey supports LDAP authentication through the official [valkey-ldap module](https://github.com/valkey-io/valkey-ldap), compatible with Valkey versions 7.2.x and above. To enable this feature, you must load the module on your Valkey server.

This module allows Valkey to authenticate users using external LDAP-based systems, such as Active Directory. It seamlessly integrates Valkey’s authentication with enterprise identity management solutions, enabling organizations to leverage their existing authentication infrastructure.

This module supports two LDAP authentication modes. The `bind` mode, and the `search+bind` mode.

The `bind` mode is used when the username provided in the Valkey [`AUTH`](../commands/auth.md) command matches a substring of the distinguished name (DN) of user entries in the LDAP directory. The `search+bind` mode offers greater flexibility, allowing the username to match any attribute value of an LDAP user entry, making it suitable for more complex directory structures.

## Bind Mode Authentication

In the `bind` mode, the module constructs the distinguished name (DN) by adding a configurable prefix and suffix to the username. 

Typically, the prefix is set to `CN=` or `DOMAIN\` for Active Directory environments, while the suffix defines the remainder of the DN in non-Active Directory setups.

Here’s an example of how to use `bind` mode for authentication.

Consider the following LDAP user entry:

```
dn: uid=ben,ou=engineering,dc=valkey,dc=io
objectclass: person
objectclass: inetOrgPerson
cn: Ben Alex
sn: Alex
uid: ben
```

In this case, the DN is `uid=ben,ou=engineering,dc=valkey,dc=io`, and the username is `ben`. To use `bind` mode, set the prefix to `uid=` and the suffix to `,ou=engineering,dc=valkey,dc=io`.

You can configure these values using the `ldap.bind_dn_prefix` and `ldap.bind_dn_suffix` options.

## Search+Bind Authentication

In the `search+bind` mode, the module first binds to the LDAP directory using a username and password of an account that has permissions to perform search operations in the LDAP directory. These credentials are stored in the module configuration, where you specify the bind DN (Distinguished Name) in `ldap.search_bind_dn` and the password in `ldap.search_bind_passwd`.

If no username and password is configured for search bind account, an anonymous bind will be attempted to the directory.

**Warning:** Anonymous binds can expose sensitive directory information if not properly restricted. 
Ensure that your LDAP server is configured to limit access for anonymous users to prevent unintended data exposure.

After the binding phase, a search operation is performed over the subtree at a configurable base DN string, which is set in the module configuration under the `ldap.search_base_dn` parameter. The module will then attempt to match the username specified in the `AUTH` command against the value of a configurable entry attribute, defined by the `ldap.search_attribute` parameter in the configuration.

Once the user entry is found, the module retrieves the user’s DN from the attribute specified by the `ldap.search_dn_attribute` configuration option. It then re-binds to the LDAP directory as this user, using the extracted DN and the password provided in the `AUTH` command, to verify the login credentials.

Here’s an example of how to use `search+bind` mode for authentication.

Consider the following LDAP user entry:

```
dn: cn=Ben Alex,ou=engineering,dc=valkey,dc=io
objectClass: person
objectClass: inetOrgPerson
entryDN: cn=Ben Alex,ou=engineering,dc=valkey,dc=io
cn: Ben Alex
sn: Alex
uid: ben
```

In this example, the username `ben` is stored in the `uid` attribute, and the user's DN is stored in the `entryDN` attribute. Since it's not possible to construct the DN using the username with a prefix and suffix as in the `bind` mode, you need to use `search+bind` mode to locate the user entry and extract its DN.

Set `ldap.search_attribute` to `uid` and `ldap.search_dn_attribute` to `entryDN` to match the username and retrieve the DN.

You can also use the `ldap.search_filter` option to restrict which LDAP objects are included in the search. By default, `ldap.search_filter` is set to `objectClass=*`, which matches all objects.

Internally, the module performs an LDAP search with a filter like `(&(objectClass=*)(uid=ben))`, which matches the entry above. It then extracts the DN from the `entryDN` attribute and re-binds using this DN and the password provided in the `AUTH` command to complete authentication.

### Comparison with Bind Mode

While `bind` mode is simpler and faster, as it directly constructs the DN from the username, it is best suited for environments where the directory structure is straightforward and usernames directly correspond to DN components. 

On the other hand, `search+bind` mode provides greater flexibility, allowing authentication in complex directory structures where usernames may not directly map to DN components. 

However, this flexibility comes at the cost of additional LDAP requests, making it slightly slower than `bind` mode.

## Setting Up Valkey Users

The LDAP server is used solely for authenticating users.
Authorization rules for each user must be configured in Valkey using either the [`ACL SETUSER`](../commands/acl-setuser.md) command, through entries in `valkey.conf`, or using an [ACL file](acl.md).
This means that user accounts must exist in Valkey in order for LDAP authentication to succeed.

For example, to allow the user `bob` to authenticate via LDAP, a corresponding user named `bob` must be present in the Valkey ACL database.

To ensure that `bob` cannot log in using password-based authentication, you can create the Valkey user without specifying a password.

To create a user without a password, simply omit the password when running the `ACL SETUSER` command and define the appropriate ACL rules. For example:

```
ACL SETUSER bob on +@hash
```

After creating the user `bob` in Valkey, authentication will only be possible through the LDAP module.

## Setting Up LDAP module

All module configuration options are prefixed with `ldap.` and can be set using the `CONFIG SET` command. To view the current values of all module-related options, use the command `CONFIG GET ldap.*`.

After the module is loaded in Valkey, the first thing that is required for the LDAP authentication to work is to configure the list of LDAP servers that should be used for the authentication.

The configuration option `ldap.servers` accepts a space separated list of LDAP URLs of the form `ldap[s]://<domain>:<port>`.

After setting this option, the module will initialize the connection pools to the configured LDAP servers.

The authentication mode `bind` vs `search+bind` is configured using the `ldap.auth_mode` option.

### TLS Configuration

The LDAP protocol supports two methods for securing connections between the client and the server: **LDAPS** and **STARTTLS**.

- **LDAPS (LDAP over SSL):**  
  LDAPS secures the connection by establishing an SSL/TLS session as soon as the TCP connection is made, typically on port 636. All communication between the client and server is encrypted from the start. To use LDAPS, specify an LDAP URL with the `ldaps://` scheme.

- **STARTTLS:**  
  STARTTLS starts with a standard, unencrypted LDAP connection (usually on port 389). The client then issues a STARTTLS command to upgrade the connection to TLS encryption. To enable this method, set the `ldap.use_starttls` option to `yes`.

Both methods provide strong encryption for LDAP traffic. The choice depends on your environment and security requirements. Make sure your LDAP server is configured with valid SSL/TLS certificates to support secure connections.

To verify LDAP server certificates, use the `ldap.tls_ca_cert_path` option to specify the path to a trusted CA certificate file. If this option is not set, the module will use the system’s default trusted CA certificates.

If you need to use client certificates for authentication, configure the `ldap.tls_cert_path` and `ldap.tls_key_path` options with the paths to your client certificate and private key.

## Monitoring

The module extends the output of the `INFO` command by adding a new section called `ldap_status`, which provides status information for each LDAP server configured via the `ldap.servers` option.

The `ldap_status` section includes a dictionary entry for each server, with the following possible fields:

- `host`: The server hostname extracted from the URL specified in the `ldap.servers` configuration.
- `status`: Indicates the server's health. Possible values are `healthy` (the server is reachable and responds to LDAP operations) or `unhealthy` (the server cannot process LDAP operations).
- `ping_time_ms`: The round-trip time (RTT) for a simple LDAP operation, in milliseconds. This field is shown only for `healthy` servers.
- `error`: A description of the error that caused the server to be marked as `unhealthy`. This field is shown only for `unhealthy` servers.

Example output from the `INFO` command:

```
# ldap_status
ldap_server_0:host=<hostname>,status=unhealthy,error=<some error message>
ldap_server_1:host=<hostname>,status=healthy,ping_time_ms=1.645
```

## Advanced Configuration

The LDAP module provides several configuration options to help adapt authentication behavior to your network environment and LDAP server load.

### LDAP Server Connection Management

Because LDAP servers are often shared by multiple applications, it's important to limit the number of connections each application opens to avoid exhausting the server's resources.

The `ldap.connection_pool_size` option specifies the maximum number of connections the module will open to each configured LDAP server. Set this value based on the expected number of concurrent authentication requests in Valkey and the maximum number of connections your LDAP server can support.

If the number of parallel authentication requests exceeds the configured pool size, authentication latency may increase as requests wait for available connections.

### LDAP Server Failure Detection

The module includes a background process that periodically checks the status of each configured LDAP server.

The frequency of these checks is controlled by the `ldap.failure_detector_interval` option, which accepts a value in seconds.

If the failure detector determines that an LDAP server is unreachable or unable to process LDAP operations, it marks the server as "unhealthy" and automatically fails over authentication requests to another available LDAP server.

If network latency between Valkey and the LDAP server is variable, or if the LDAP server is under heavy load, you can adjust the connection and operation timeouts using the `ldap.timeout_connection` and `ldap.timeout_ldap_operation` options.


## Configuration Options

### General Options

| Config Name            | Type                         | Default | Description                                                                                                   |
|------------------------|------------------------------|---------|---------------------------------------------------------------------------------------------------------------|
| `ldap.auth_mode`       | Enum(`bind`, `search+bind`)  | `bind`  | The authentication method.    |
| `ldap.servers`         | string                       | `""`    | Space-separated list of LDAP URLs in the form `ldap[s]://<domain>:<port>`.                                    |

### TLS Options

| Config Name             | Type    | Default | Description                                                                                      |
|-------------------------|---------|---------|--------------------------------------------------------------------------------------------------|
| `ldap.use_starttls`     | boolean | `no`    | Whether to upgrade to a TLS-encrypted connection using the STARTTLS operation (RFC 4513).         |
| `ldap.tls_ca_cert_path` | string  | `""`    | Filesystem path to the CA certificate for validating the LDAP server certificate.                 |
| `ldap.tls_cert_path`    | string  | `""`    | Filesystem path to the client certificate for TLS connections to the LDAP server.                 |
| `ldap.tls_key_path`     | string  | `""`    | Filesystem path to the client certificate key for TLS connections to the LDAP server.             |

### Bind Mode Options

| Config Name           | Type   | Default  | Description                                                                                      |
|-----------------------|--------|----------|--------------------------------------------------------------------------------------------------|
| `ldap.bind_dn_prefix` | string | `"cn="`  | String to prepend to the username from the `AUTH` command when forming the DN for LDAP bind.      |
| `ldap.bind_dn_suffix` | string | `""`     | String to append to the username from the `AUTH` command when forming the DN for LDAP bind.       |

### Search+Bind Mode Options

| Config Name              | Type                         | Default           | Description                                                                                      |
|--------------------------|------------------------------|-------------------|--------------------------------------------------------------------------------------------------|
| `ldap.search_bind_dn`    | string                       | `""`              | DN of the user account used to perform LDAP searches.                                            |
| `ldap.search_bind_passwd`| string                       | `""`              | Password for the search bind user.                                                               |
| `ldap.search_base`       | string                       | `""`              | Base DN where the search for the user entry begins.                                              |
| `ldap.search_filter`     | string                       | `"objectClass=*"` | LDAP search filter to apply when searching for user entries.                                     |
| `ldap.search_attribute`  | string                       | `"uid"`           | LDAP attribute to match against the username provided in the `AUTH` command.                     |
| `ldap.search_scope`      | Enum(`base`, `one`, `sub`)   | `sub`             | Scope of the LDAP search.                                                                        |
| `ldap.search_dn_attribute`| string                      | `"entryDN"`       | Attribute containing the DN of the user entry.                                                   |

### Advanced Options

| Config Name                  | Type   | Default | Description                                                                                      |
|------------------------------|--------|---------|--------------------------------------------------------------------------------------------------|
| `ldap.connection_pool_size`  | number | `2`     | Number of connections in each LDAP server's connection pool.                                      |
| `ldap.failure_detector_interval` | number | `1`  | Interval (in seconds) between each failure detector check.                                        |
| `ldap.timeout_connection`    | number | `10`    | Number of seconds to wait when connecting to an LDAP server before timing out.                    |
| `ldap.timeout_ldap_operation`| number | `10`    | Number of seconds to wait for an LDAP operation before timing out.                                |

