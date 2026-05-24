---
title: "JSON.RESP"
description: "JSON.RESP command reference documentation"
---

Return the JSON value at the given path in Redis Serialization Protocol (RESP).
If the value is container, the response is RESP array or nested array.


* JSON null is mapped to the RESP Null Bulk String.
* JSON boolean values are mapped to the respective RESP Simple Strings.
* Integer numbers are mapped to RESP Integers.
* Floating point numbers are mapped to RESP Bulk Strings.
* JSON Strings are mapped to RESP Bulk Strings.
* JSON Arrays are represented as RESP Arrays, where the first element is the simple string [, followed by the array's elements.
* JSON Objects are represented as RESP Arrays, where the first element is the simple string {, followed by key-value pairs, each of which is a RESP bulk string.

## Examples

Enhanced path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"firstName":"John","lastName":"Smith","age":27,"weight":135.25,"isAlive":true,"address":{"street":"21 2nd Street","city":"New York","state":"NY","zipcode":"10021-3100"},"phoneNumbers":[{"type":"home","number":"212 555-1234"},{"type":"office","number":"646 555-4567"}],"children":[],"spouse":null}'
OK

127.0.0.1:6379> JSON.RESP k1 $.address
1) 1) {
   2) 1) "street"
      2) "21 2nd Street"
   3) 1) "city"
      2) "New York"
   4) 1) "state"
      2) "NY"
   5) 1) "zipcode"
      2) "10021-3100"

127.0.0.1:6379> JSON.RESP k1 $.address.*
1) "21 2nd Street"
2) "New York"
3) "NY"
4) "10021-3100"

127.0.0.1:6379> JSON.RESP k1 $.phoneNumbers
1) 1) [
   2) 1) {
      2) 1) "type"
         2) "home"
      3) 1) "number"
         2) "212 555-1234"
   3) 1) {
      2) 1) "type"
         2) "office"
      3) 1) "number"
         2) "646 555-4567"

127.0.0.1:6379> JSON.RESP k1 $.phoneNumbers[*]
1) 1) {
   2) 1) "type"
      2) "home"
   3) 1) "number"
      2) "212 555-1234"
2) 1) {
   2) 1) "type"
      2) "office"
   3) 1) "number"
      2) "646 555-4567"
```

Restricted path syntax:

```bash
127.0.0.1:6379> JSON.SET k1 . '{"firstName":"John","lastName":"Smith","age":27,"weight":135.25,"isAlive":true,"address":{"street":"21 2nd Street","city":"New York","state":"NY","zipcode":"10021-3100"},"phoneNumbers":[{"type":"home","number":"212 555-1234"},{"type":"office","number":"646 555-4567"}],"children":[],"spouse":null}'
OK

127.0.0.1:6379> JSON.RESP k1 .address
1) {
2) 1) "street"
   2) "21 2nd Street"
3) 1) "city"
   2) "New York"
4) 1) "state"
   2) "NY"
5) 1) "zipcode"
   2) "10021-3100"

127.0.0.1:6379> JSON.RESP k1
 1) {
 2) 1) "firstName"
    2) "John"
 3) 1) "lastName"
    2) "Smith"
 4) 1) "age"
    2) (integer) 27
 5) 1) "weight"
    2) "135.25"
 6) 1) "isAlive"
    2) true
 7) 1) "address"
    2) 1) {
       2) 1) "street"
          2) "21 2nd Street"
       3) 1) "city"
          2) "New York"
       4) 1) "state"
          2) "NY"
       5) 1) "zipcode"
          2) "10021-3100"
 8) 1) "phoneNumbers"
    2) 1) [
       2) 1) {
          2) 1) "type"
             2) "home"
          3) 1) "number"
             2) "212 555-1234"
       3) 1) {
          2) 1) "type"
             2) "office"
          3) 1) "number"
             2) "646 555-4567"
 9) 1) "children"
    2) 1) [
10) 1) "spouse"
    2) (nil)
```
