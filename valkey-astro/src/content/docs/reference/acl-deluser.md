---
title: "ACL DELUSER"
description: "ACL DELUSER command reference documentation"
---

Delete all the specified ACL users and terminate all the connections that are
authenticated with such users. Note: the special `default` user cannot be
removed from the system, this is the default user that every new connection
is authenticated with. The list of users may include usernames that do not
exist, in such case no operation is performed for the non existing users.

## Examples

```
127.0.0.1:6379> ACL DELUSER antirez
(integer) 1
```
