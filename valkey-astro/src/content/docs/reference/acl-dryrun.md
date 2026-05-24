---
title: "ACL DRYRUN"
description: "ACL DRYRUN command reference documentation"
---

Simulate the execution of a given command by a given user.
This command can be used to test the permissions of a given user without having to enable the user or cause the side effects of running the command.

## Examples

```
127.0.0.1:6379> ACL SETUSER VIRGINIA +SET ~*
"OK"
127.0.0.1:6379> ACL DRYRUN VIRGINIA SET foo bar
"OK"
127.0.0.1:6379> ACL DRYRUN VIRGINIA GET foo
"User VIRGINIA has no permissions to run the 'get' command"
```
