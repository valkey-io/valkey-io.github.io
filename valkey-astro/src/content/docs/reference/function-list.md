---
title: "FUNCTION LIST"
description: "FUNCTION LIST command reference documentation"
---

Return information about the functions and libraries.

You can use the optional `LIBRARYNAME` argument to specify a pattern for matching library names.
The optional `WITHCODE` modifier will cause the server to include the libraries source implementation in the reply.

The following information is provided for each of the libraries in the response:

* **library_name:** the name of the library.
* **engine:** the engine of the library.
* **functions:** the list of functions in the library.
  Each function has the following fields:
  * **name:** the name of the function.
  * **description:** the function's description.
  * **flags:** an array of [function flags](../topics/functions-intro.md#function-flags).
* **library_code:** the library's source code (when given the `WITHCODE` modifier).

For more information please refer to [Introduction to Valkey Functions](../topics/functions-intro.md).
