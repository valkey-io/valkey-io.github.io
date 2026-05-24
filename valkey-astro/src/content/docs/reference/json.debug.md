---
title: "JSON.DEBUG"
description: "JSON.DEBUG command reference documentation"
---

Report information. Supported subcommands are:


* MEMORY <key> [path] - report memory usage in bytes of a JSON value. Path defaults to the root if not provided.
* DEPTH <key> - report the maximum path depth of the JSON document.
* FIELDS <key> [path] - report the number of fields at the specified document path. Path defaults to the root if not provided.
  Each non-container JSON value counts as one field. Objects and arrays recursively count one field for each of their
  containing JSON values. Each container value, except the root container, counts as one additional field.
* HELP - print help messages of the command.

## Examples

Enhanced path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '[1, 2.3, "foo", true, null, {}, [], {"a":1, "b":2}, [1,2,3]]'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY k1 $[*]
1) (integer) 16
2) (integer) 16
3) (integer) 19
4) (integer) 16
5) (integer) 16
6) (integer) 16
7) (integer) 16
8) (integer) 50
9) (integer) 64
127.0.0.1:6379> JSON.DEBUG FIELDS k1 $[*]
1) (integer) 1
2) (integer) 1
3) (integer) 1
4) (integer) 1
5) (integer) 1
6) (integer) 0
7) (integer) 0
8) (integer) 2
9) (integer) 3
```

Restricted path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"firstName":"John","lastName":"Smith","age":27,"weight":135.25,"isAlive":true,"address":{"street":"21 2nd Street","city":"New York","state":"NY","zipcode":"10021-3100"},"phoneNumbers":[{"type":"home","number":"212 555-1234"},{"type":"office","number":"646 555-4567"}],"children":[],"spouse":null}'
OK
127.0.0.1:6379> JSON.DEBUG MEMORY k1
(integer) 632
127.0.0.1:6379> JSON.DEBUG MEMORY k1 .phoneNumbers
(integer) 166

127.0.0.1:6379> JSON.DEBUG FIELDS k1
(integer) 19
127.0.0.1:6379> JSON.DEBUG FIELDS k1 .address
(integer) 4
```

```bash
127.0.0.1:6379> JSON.DEBUG HELP
1) JSON.DEBUG MEMORY <key> [path] - report memory size (bytes) of the JSON element. Path defaults to root if not provided.
2) JSON.DEBUG FIELDS <key> [path] - report number of fields in the JSON element. Path defaults to root if not provided.
3) JSON.DEBUG DEPTH <key> - report depth of JSON doc.
3) JSON.DEBUG HELP - print help message.
```