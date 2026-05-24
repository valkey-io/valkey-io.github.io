---
title: "JSON.GET"
description: "JSON.GET command reference documentation"
---

Get the serialized JSON at one or multiple paths.


## Examples

Enhanced path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"firstName":"John","lastName":"Smith","age":27,"weight":135.25,"isAlive":true,"address":{"street":"21 2nd Street","city":"New York","state":"NY","zipcode":"10021-3100"},"phoneNumbers":[{"type":"home","number":"212 555-1234"},{"type":"office","number":"646 555-4567"}],"children":[],"spouse":null}'
OK
127.0.0.1:6379> JSON.GET k1 $.address.*
"[\"21 2nd Street\",\"New York\",\"NY\",\"10021-3100\"]"
127.0.0.1:6379> JSON.GET k1 indent "\t" space " " NEWLINE "\n" $.address.*
"[\n\t\"21 2nd Street\",\n\t\"New York\",\n\t\"NY\",\n\t\"10021-3100\"\n]"
127.0.0.1:6379> JSON.GET k1 $.firstName $.lastName $.age
"{\"$.firstName\":[\"John\"],\"$.lastName\":[\"Smith\"],\"$.age\":[27]}"

127.0.0.1:6379> JSON.SET k2 . '{"a":{}, "b":{"a":1}, "c":{"a":1, "b":2}}'
OK
127.0.0.1:6379> json.get k2 $..*
"[{},{\"a\":1},{\"a\":1,\"b\":2},1,1,2]"
```

Restricted path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"firstName":"John","lastName":"Smith","age":27,"weight":135.25,"isAlive":true,"address":{"street":"21 2nd Street","city":"New York","state":"NY","zipcode":"10021-3100"},"phoneNumbers":[{"type":"home","number":"212 555-1234"},{"type":"office","number":"646 555-4567"}],"children":[],"spouse":null}'
OK
127.0.0.1:6379> JSON.GET k1 .address
"{\"street\":\"21 2nd Street\",\"city\":\"New York\",\"state\":\"NY\",\"zipcode\":\"10021-3100\"}"
127.0.0.1:6379> JSON.GET k1 indent "\t" space " " NEWLINE "\n" .address
"{\n\t\"street\": \"21 2nd Street\",\n\t\"city\": \"New York\",\n\t\"state\": \"NY\",\n\t\"zipcode\": \"10021-3100\"\n}"
127.0.0.1:6379> JSON.GET k1 .firstName .lastName .age
"{\".firstName\":\"John\",\".lastName\":\"Smith\",\".age\":27}"
```
