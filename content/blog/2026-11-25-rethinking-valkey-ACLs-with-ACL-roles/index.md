+++
title = "Rethinking Valkey ACLs with ACL Roles"
description = "Valkey 9.2 allows you to group and manage permisisons in ACL Roles"
date = 2026-11-25
authors = ["kjaymiller"]
+++

With the recent release of [Valkey 9.2][Valkey 9.2 Announcement], Access Control Lists (ACLs) gained the ability to be defined in _roles_, to go alongside per user assignments. This greatly improves how ACLs can be applied and managed.

## What are ACLs

An ACL is a rule that grants or restricts access to specific commands, keys, channels, and databases. Valkey's ACLs use a domain-specific language to allow or deny a user access to each of them.

```
# create a user that can only read keys (but has access to all keys '~*')
ACL SETUSER read-only-user on #<SHA256_HASH_OF_PASSWORD> ~* +@read
```

## ACLs prior to 9.2

ACLs have been in Valkey since its creation. They serve several purposes all around _access_ (hence the name) and auditability.

When your Valkey cluster is connecting to several applications and users, you end up with a complicated `aclfile` that you have to maintain.

Each rule in this file controls access along several dimensions: which user, which keys, which commands, and which channels. In Valkey 9.1, per-database rules (using `db=`) added one more. Every rule below is pinned to db=0, so the sample below grows quickly once you add databases.

```
# Rules apply left to right. Each user starts from -@all and adds, so new command categories fail closed.

# lock down default
user default off resetkeys resetchannels resetdbs -@all

# --- internal / infra ---
user replica-sync     on #<HASH:replica-sync>   resetkeys +psync +replconf +ping
user sentinel-admin   on #<HASH:sentinel-admin> resetkeys allchannels +multi +slaveof +ping +exec +subscribe +config|rewrite +role +publish +info +client|setname +client|kill +script|kill
# config|get dropped: it returns masterauth/requirepass. Re-add only if the exporter needs it.
user metrics-exporter on #<HASH:metrics-exporter> resetkeys resetchannels db=0 -@all +ping +info +client|list +slowlog|get +latency|latest +memory|stats +dbsize

# --- apps ---
user checkout-svc     on #<HASH:checkout-svc>     resetkeys resetchannels db=0 ~checkout:* ~session:* %R~catalog:* &checkout-events:* -@all +@read +@write +@pubsub -@dangerous -@admin -@scripting +ping +hello +client|setname +client|setinfo
user catalog-writer   on #<HASH:catalog-writer>   resetkeys resetchannels db=0 ~catalog:* ~tmp:catalog:* -@all +@read +@write -@dangerous -@admin -@scripting +ping +hello +client|setname +client|setinfo
user catalog-reader   on #<HASH:catalog-reader>   resetkeys resetchannels db=0 %R~catalog:* %R~pricing:* -@all +@read -@dangerous -@scripting +ping +hello +client|setname +client|setinfo
# legacy-batch: was nopass ~* &* +@all. catalog:* is a placeholder until its real keyspace is known.
user legacy-batch     on #<HASH:legacy-batch>     resetkeys resetchannels db=0 ~catalog:* ~tmp:catalog:* -@all +@read +@write -@dangerous -@admin -@scripting +ping +hello +client|setname +client|setinfo

# --- humans ---
# oncall-sre: read-only. The old selectors were no-ops (root already had +@all). CONFIG SET / MONITOR go on a separate break-glass user.
user oncall-sre       on #<HASH:oncall-sre>       resetkeys resetchannels db=0 %R~* &* -@all +@read -@dangerous -@scripting +ping +hello +info +client|list +client|info +slowlog|get +latency|latest +memory|stats +dbsize +config|get +acl|whoami +acl|log
# support-readonly: root grants nothing; each selector sets its own db= (selectors default to alldbs).
# Notes selector no longer has FLUSHDB/FLUSHALL, KEYS/SCAN, UNLINK/GETDEL, FUNCTION/EVAL.
user support-readonly on #<HASH:support-readonly> resetkeys resetchannels resetdbs -@all (db=0 %R~customer:* %R~order:* +get +hgetall +lrange +ttl +type +ping +hello) (db=0 ~support:notes:* +@read +@write -@dangerous -@scripting -del -unlink -getdel +ping +hello)
```

Notice how much of that is repetition. `+ping +hello +client|setname +client|setinfo` shows up on every app user. `checkout-svc` and `catalog-writer` share command rules and differ mostly in key patterns. If apps shouldn't run `@scripting`, you edit every line, and any line you miss is a user with more access than you meant to give.

## 9.2 has added Roles to make things easier

Valkey 9.2 has introduced ACL roles that allow you to set permissions to a role and then you can assign an individual to one or more roles.

A role holds the same kind of permissions a user does.

```
ACL SETROLE conn-basics    resetchannels +ping +hello +client|setname +client|setinfo

ACL SETROLE catalog-read   resetchannels db=0 %R~catalog:* %R~pricing:* +@read -@dangerous -@scripting

ACL SETROLE catalog-write  resetchannels db=0 ~catalog:* ~tmp:catalog:* +@read +@write -@dangerous -@admin -@scripting

ACL SETROLE checkout-app   db=0 ~checkout:* ~session:* %R~catalog:* &checkout-events:* +@read +@write +@pubsub -@dangerous -@admin -@scripting

ACL SETROLE support-ro     resetchannels db=0 %R~customer:* %R~order:* +get +hgetall +lrange +ttl +type

ACL SETROLE support-notes  resetchannels db=0 ~support:notes:* +@read +@write -@dangerous -@scripting -del -unlink -getdel

ACL SETROLE ops-readonly   resetchannels db=0 %R~* &* +@read -keys -@scripting +info +client|list +client|info +slowlog|get +latency|latest +memory|stats +dbsize +config|get +acl|whoami +acl|log
```

Look at what the users would look like now.

```
# The same users from the first aclfile, now one line each.
# Each role= list replaces the long rule list that user had above.

user checkout-svc     on #<HASH:checkout-svc>     resetkeys resetchannels resetdbs -@all role=conn-basics,checkout-app

user catalog-writer   on #<HASH:catalog-writer>   resetkeys resetchannels resetdbs -@all role=conn-basics,catalog-write

user catalog-reader   on #<HASH:catalog-reader>   resetkeys resetchannels resetdbs -@all role=conn-basics,catalog-read

# legacy-batch: catalog:* is still a placeholder until its real keyspace is known.
user legacy-batch     on #<HASH:legacy-batch>     resetkeys resetchannels resetdbs -@all role=conn-basics,catalog-write

user oncall-sre       on #<HASH:oncall-sre>       resetkeys resetchannels resetdbs -@all role=conn-basics,ops-readonly

user support-readonly on #<HASH:support-readonly> resetkeys resetchannels resetdbs -@all role=conn-basics,support-ro,support-notes
```

Now you’re able to give access based on the role. This makes it clear what access each user has.

The `catalog-reader` doesn’t need write access to the catalog, and `support-readonly` doesn’t need access to checkout.

If you need to update one of the roles, run the `SETROLE` command again with the new permissions. This will automatically update the permissions for all the users with that role. This is a faster and cleaner way to adjust permissions for groups of users than having to do them one-by-one manually.

You can still apply a one-off role. New rules are applied on top of what the role already has, so to narrow a role add a negative rule (for example `ACL SETROLE catalog-write -@admin`). Every user holding the role picks up the change immediately, and Pub/Sub clients that lose access to their channels are disconnected.

The addition of roles is a departure from the traditional process. Instead of migrating all the permissions over at once, I recommend a slow consistent migration. Create roles for new permission groups. When you onboard a new user account, only apply roles. If you create a new role that can be applied, backport the roles to existing users, replacing the permissions they currently have.

Learn more about ACL Roles in the [ACL topic] and the [ACL Roles Command Page] on the Valkey Website.

[ACL topic]: https://valkey.io/topics/acl/#roles
[ACL Roles Command Page]: https://valkey.io/commands/acl-roles/
[Valkey 9.2 Announcement]: https://valkey.io/blog/valkey-9.2-release/
