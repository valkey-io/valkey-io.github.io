---
title: "JSON.TYPE"
description: "JSON.TYPE command reference documentation"
---

Report type of the values at the given path.

## Examples

Enhanced path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '[1, 2.3, "foo", true, null, {}, []]'
OK
127.0.0.1:6379> JSON.TYPE k1 $[*]
1) integer
2) number
3) string
4) boolean
5) null
6) object
7) array
```

Restricted path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"firstName":"John","lastName":"Smith","age":27,"weight":135.25,"isAlive":true,"address":{"street":"21 2nd Street","city":"New York","state":"NY","zipcode":"10021-3100"},"phoneNumbers":[{"type":"home","number":"212 555-1234"},{"type":"office","number":"646 555-4567"}],"children":[],"spouse":null}'
OK
127.0.0.1:6379> JSON.TYPE k1
object
127.0.0.1:6379> JSON.TYPE k1 .children
array
127.0.0.1:6379> JSON.TYPE k1 .firstName
string
127.0.0.1:6379> JSON.TYPE k1 .age
integer
127.0.0.1:6379> JSON.TYPE k1 .weight
number
127.0.0.1:6379> JSON.TYPE k1 .isAlive
boolean
127.0.0.1:6379> JSON.TYPE k1 .spouse
null
```
