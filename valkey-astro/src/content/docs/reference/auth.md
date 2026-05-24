---
title: "AUTH"
description: "AUTH command reference documentation"
---

The AUTH command authenticates the current connection using the [Valkey ACL system](../topics/acl.md).

The standard way to `AUTH` is the two-argument form:

    AUTH <username> <password>

This authenticates the current connection with one of the users
defined in the ACL list (see [`ACL SETUSER`](acl-setuser.md) and the official [ACL guide](../topics/acl.md) for more information).

When the single argument form of the command is used, where only the password is specified,
it is assumed that the implicit username is "default".

    AUTH <password>

This form authenticates against the "default" user's password set with `requirepass`.

If the password provided via AUTH matches the password in the configuration file, the server replies with the `OK` status code and starts accepting commands.
Otherwise, an error is returned and the clients needs to try a new password.

## Security notice

Because of the high performance nature of Valkey, it is possible to try
a lot of passwords in parallel in very short time, so make sure to generate a
strong and very long password so that this attack is infeasible.
A good way to generate strong passwords is via the [`ACL GENPASS`](acl-genpass.md) command.
