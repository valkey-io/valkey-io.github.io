---
title: "Valkey JSON"
description: >
    Introduction to Valkey JSON
---

In Valkey, the JSON data type and commands are implemented in the [valkey-json](https://github.com/valkey-io/valkey-json) module which is an official valkey module compatible with versions 8.0 and above. Users will need to load this module onto their valkey server in order to use this feature.

Valkey JSON is a Valkey module written in C++ that provides native JSON (JavaScript Object Notation) support for Valkey. The implementation complies with [RFC7159](https://www.ietf.org/rfc/rfc7159.txt) and [ECMA-404](https://www.ietf.org/rfc/rfc7159.txt) JSON data interchange standards. Users can natively store, query, and modify JSON data structures using the JSONPath query language. The query expressions support advanced capabilities including wildcard selections, filter expressions, array slices, union operations, and recursive searches.

## Example Valkey JSON Commands

* `JSON.SET` sets JSON values at the path.
* `JSON.GET` gets the serialized JSON at one or multiple paths.
* `JSON.ARRINSERT` inserts one or more values into the array values at path before the index.
* `JSON.ARRLEN` gets the length of the array at the path.

See the [complete list of valkey-json commands](../commands/#json).

## Common use cases for Valkey JSON

Prior to the valkey-json module, storing JSON in Valkey typically involved serializing it into a string or use hash datatype. This approach made it difficult to work with nested data or perform partial updates. valkey-json addresses these limitations by enabling native JSON support.

Valkey JSON provides an efficient way to store and manipulate structured data. Its key benefits include fast search and filtering capabilities. It also provides the ability to perform in-place updates to JSON data without needing to overwrite entire documents. These features allow you to efficiently query, modify, and manage complex data structures, making it an ideal choice for applications that require dynamic and flexible data storage.

## JSON Properties

* Max Document Size - valkey-json allows configuring a limit on the size of individual JSON keys to prevent potential out-of-memory issues from malicious or unbounded insertions (e.g., via `JSON.ARRINSERT`). By default, this value is 0, meaning there is no limit. You can set this limit using the `CONFIG SET json.max-document-size <value>` command. Use `JSON.DEBUG MEMORY <key>` or `MEMORY USAGE <key>` to inspect memory usage.

* Max Depth - The maximum nesting level for JSON objects and arrays. If a JSON object or array contains another object or array, it is considered nested. The default maximum allowed nesting depth is 128. Any attempt to exceed this limit will result in an error. You can adjust this limit using the following command: `CONFIG SET json.max-path-limit <value>` where value is the desired depth limit.

## Performance

The performance of JSON operations in Valkey is primarily influenced by the complexity of the JSONPath evaluation and the size or depth of the JSON object. Most operations — including `JSON.GET`, `JSON.SET`, `JSON.DEL`, `JSON.NUMINCRBY`, `JSON.STRAPPEND` and `JSON.ARRAPPEND` — are typically O(1) when using direct paths but may increase to a complexity of O(N), where N is the number of paths matched. Simpler paths like `$.user.name` perform significantly faster than recursive or filtered queries such as `$..[?(@.active==true)]`.

For optimal performance, it's recommended to minimize excessive nesting, avoid frequent mutations of deeply nested objects, and use path filters judiciously.

## JSON ACL

* Similar to the existing per-datatype categories (@string, @hash, etc.), a new category @json is added to simplify managing access to JSON commands and data. No other existing Valkey commands are members of the @json category. All JSON commands enforce any keyspace or command restrictions and permissions.

* There are 4 existing Valkey ACL categories which are updated to include new JSON commands: @read, @write, @fast, @slow. The following table indicates the mapping of JSON commands to the appropriate categories.

For each of these categories and a row for each command, if the cell contains a “y” then that command is added into that category.

| JSON Command   | @json | @read | @write | @fast | @slow |
|:---------------|:------|:------|:-------|:------|:------|
| JSON.ARRAPPEND | y     |       | y      | y     |       |
| JSON.ARRINDEX  | y     | y     |        | y     |       |
| JSON.ARRINSERT | y     |       | y      | y     |       |
| JSON.ARRLEN    | y     | y     |        | y     |       |
| JSON.ARRPOP    | y     |       | y      | y     |       |
| JSON.ARRTRIM   | y     |       | y      | y     |       |
| JSON.CLEAR     | y     |       | y      | y     |       |
| JSON.DEBUG     | y     | y     |        |       | y     |
| JSON.DEL       | y     |       | y      | y     |       |
| JSON.FORGET    | y     |       | y      | y     |       |
| JSON.GET       | y     | y     |        | y     |       |
| JSON.MGET      | y     | y     |        | y     |       |
| JSON.MSET      | y     |       | y      |       | y     |
| JSON.NUMINCRBY | y     |       | y      | y     |       |
| JSON.NUMMULTBY | y     |       | y      | y     |       |
| JSON.OBJKEYS   | y     | y     |        | y     |       |
| JSON.OBJLEN    | y     | y     |        | y     |       |
| JSON.RESP      | y     | y     |        | y     |       |
| JSON.SET       | y     |       | y      |       | y     |
| JSON.STRAPPEND | y     |       | y      | y     |       |
| JSON.STRLEN    | y     | y     |        | y     |       |
| JSON.TOGGLE    | y     |       | y      | y     |       |
| JSON.TYPE      | y     | y     |        | y     |       |

## Path Syntax

Valkey JSON supports two kinds of path syntaxes:

* **Enhanced syntax** – Follows the JSONPath syntax described by [Goessner](https://goessner.net/articles/JsonPath/), as shown in the following table. We've reordered and modified the descriptions in the table for clarity.
* **Restricted syntax** – Has limited query capabilities.

If a query path starts with `$`, it uses the enhanced syntax. Otherwise, the restricted syntax is used. It is recommended that you use the enhanced syntax for new development.

**Enhanced Syntax Symbols & Expressions**

| Symbol/Expression     | Description                                                       |
|-----------------------|-------------------------------------------------------------------|
| `$`                   | The root element.                                                 |
| `.` or `[]`           | Child operator.                                                   |
| `..`                  | Recursive descent.                                                |
| `*`                   | Wildcard. All elements in an object or array.                     |
| `[]`                  | Array subscript operator. Index is 0-based.                       |
| `[ , ]`               | Union operator.                                                   |
| `[start:end:step]`    | Array slice operator.                                             |
| `?()`                 | Applies a filter (script) expression to the current array or object. |
| `()`                  | Filter expression.                                                |
| `@`                   | Used in filter expressions that refer to the current node being processed. |
| `==`                  | Equal to, used in filter expressions.                             |
| `!=`                  | Not equal to, used in filter expressions.                         |
| `>`                   | Greater than, used in filter expressions.                         |
| `>=`                  | Greater than or equal to, used in filter expressions.             |
| `<`                   | Less than, used in filter expressions.                            |
| `<=`                  | Less than or equal to, used in filter expressions.                |
| `&&`                  | Logical AND, used to combine multiple filter expressions.         |
| `\|\|`                  | Logical OR, used to combine multiple filter expressions.        |

**Examples** \
The following examples are built on [Goessner's](https://goessner.net/articles/JsonPath/) example XML data, which we have modified by adding additional fields.

```
{ "store": {
    "book": [ 
      { "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95,
        "in-stock": true,
        "sold": true
      },
      { "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99,
        "in-stock": false,
        "sold": true
      },
      { "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99,
        "in-stock": true,
        "sold": false
      },
      { "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99,
        "in-stock": false,
        "sold": false
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95,
      "in-stock": true,
      "sold": false
    }
  }
}
```

| Path                                                              | Description                                                                                   |
|-------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `'$.store.book[*].author'`                                        | The authors of all books in the store.                                                        |
| `'$..author'`                                                     | All authors.                                                                                  |
| `'$.store.*'`                                                     | All members of the store.                                                                     |
| `'$["store"].*'`                                                  | All members of the store.                                                                     |
| `'$.store..price'`                                                | The price of everything in the store.                                                         |
| `'$..*'`                                                          | All recursive members of the JSON structure.                                                  |
| `'$..book[*]'`                                                    | All books.                                                                                     |
| `'$..book[0]'`                                                    | The first book.                                                                               |
| `'$..book[-1]'`                                                   | The last book.                                                                                |
| `'$..book[0:2]'`                                                  | The first two books.                                                                          |
| `'$..book[0,1]'`                                                  | The first two books.                                                                          |
| `'$..book[0:4]'`                                                  | Books from index 0 to 3 (ending index is not inclusive).                                      |
| `'$..book[0:4:2]'`                                                | Books at index 0 and 2.                                                                       |
| `'$..book[?(@.isbn)]'`                                            | All books with an ISBN number.                                                                |
| `'$..book[?(@.price < 10)]'`                                      | All books cheaper than $10.                                                                   |
| `'$..book[?(@["price"] < 10)]'`                                   | All books cheaper than $10. (alternate syntax)                                                |
| `'$..book[?(@.["price"] < 10)]'`                                  | All books cheaper than $10. (alternate syntax)                                                |
| `'$..book[?(@.price >= 10 && @.price <= 100)]'`                   | All books in the price range of $10 to $100, inclusive.                                       |
| `'$..book[?(@.sold == true \|\| @.in-stock == false)]'`            | All books sold or out of stock.                                                               |
| `'$.store.book[?(@.["category"] == "fiction")]'`                  | All books in the fiction category.                                                            |
| `'$.store.book[?(@.["category"] != "fiction")]'`                  | All books in nonfiction categories.                                                           |

Additional filter expression examples:

```
127.0.0.1:6379> JSON.SET k1 . '{"books": [{"price":5,"sold":true,"in-stock":true,"title":"foo"}, {"price":15,"sold":false,"title":"abc"}]}'
OK
127.0.0.1:6379> JSON.GET k1 $.books[?(@.price>1&&@.price<20&&@.in-stock)]
"[{\"price\":5,\"sold\":true,\"in-stock\":true,\"title\":\"foo\"}]"
127.0.0.1:6379> JSON.GET k1 '$.books[?(@.price>1 && @.price<20 && @.in-stock)]'
"[{\"price\":5,\"sold\":true,\"in-stock\":true,\"title\":\"foo\"}]"
127.0.0.1:6379> JSON.GET k1 '$.books[?((@.price>1 && @.price<20) && (@.sold==false))]'
"[{\"price\":15,\"sold\":false,\"title\":\"abc\"}]"
127.0.0.1:6379> JSON.GET k1 '$.books[?(@.title == "abc")]'
[{"price":15,"sold":false,"title":"abc"}]

127.0.0.1:6379> JSON.SET k2 . '[1,2,3,4,5]'
OK
127.0.0.1:6379> JSON.GET k2 $.*.[?(@>2)]
"[3,4,5]"
127.0.0.1:6379> JSON.GET k2 '$.*.[?(@ > 2)]'
"[3,4,5]"

127.0.0.1:6379> JSON.SET k3 . '[true,false,true,false,null,1,2,3,4]'
OK
127.0.0.1:6379> JSON.GET k3 $.*.[?(@==true)]
"[true,true]"
127.0.0.1:6379> JSON.GET k3 '$.*.[?(@ == true)]'
"[true,true]"
127.0.0.1:6379> JSON.GET k3 $.*.[?(@>1)]
"[2,3,4]"
127.0.0.1:6379> JSON.GET k3 '$.*.[?(@ > 1)]'
"[2,3,4]"
```

**Restricted Syntax Symbols and Expressions**

| Symbol/Expression     | Description                                                       |
|-----------------------|-------------------------------------------------------------------|
| `.` or `[]`           | Child operator.                                                   |
| `[]`                  | Array subscript operator. Index is 0-based.                       |


| Path                                  | Description                        |
|---------------------------------------|------------------------------------|
| `'.store.book[0].author'`             | The author of the first book.      |
| `'.store.book[-1].author'`            | The author of the last book.       |
| `'.address.city'`                     | City name.                         |
| `'["store"]["book"][0]["title"]'`     | The title of the first book.       |
| `'["store"]["book"][-1]["title"]'`    | The title of the last book.        |

## Common error prefixes

Each error message has a prefix. The following is a list of common error prefixes.

| Prefix           | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `ERR`            | A general error.                                                            |
| `LIMIT`          | An error that occurs when the size limit is exceeded. For example, the document size limit or nesting depth limit was exceeded. |
| `NONEXISTENT`    | A key or path does not exist.                                               |
| `OUTOFBOUNDARIES`| Array index out of bounds.                                                  |
| `SYNTAXERR`      | Syntax error.                                                               |
| `WRONGTYPE`      | Wrong value type.                 

## JSON-related metrics

| Info                     | Description                                                   |
|--------------------------|---------------------------------------------------------------|
| `json_total_memory_bytes`| Total memory allocated to JSON objects.                       |
| `json_num_documents`     | Total number of documents in Valkey                           |

To query core metrics, run the following command: `info json_core_metrics`