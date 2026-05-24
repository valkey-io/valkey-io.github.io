---
title: "XREVRANGE"
description: "XREVRANGE command reference documentation"
---

This command is exactly like `XRANGE`, but with the notable difference of
returning the entries in reverse order, and also taking the start-end
range in reverse order: in `XREVRANGE` you need to state the *end* ID
and later the *start* ID, and the command will produce all the element
between (or exactly like) the two IDs, starting from the *end* side.

So for instance, to get all the elements from the higher ID to the lower
ID one could use:

    XREVRANGE somestream + -

Similarly to get just the last element added into the stream it is
enough to send:

    XREVRANGE somestream + - COUNT 1

## Examples

```
127.0.0.1:6379> XADD writers * name Virginia surname Woolf
"1714701492147-0"
127.0.0.1:6379> XADD writers * name Jane surname Austen
"1714701492157-0"
127.0.0.1:6379> XADD writers * name Toni surname Morrison
"1714701492167-0"
127.0.0.1:6379> XADD writers * name Agatha surname Christie
"1714701492177-0"
127.0.0.1:6379> XADD writers * name Ngozi surname Adichie
"1714701492187-0"
127.0.0.1:6379> XLEN writers
(integer) 5
127.0.0.1:6379> XREVRANGE writers + - COUNT 1
1) 1) "1714701492187-0"
   2) 1) "name"
      2) "Ngozi"
      3) "surname"
      4) "Adichie"
```
