+++
title = "How is Valkey different from other key-value stores?"
weight = 2

[extra]
question = "How is Valkey different from other key-value stores?"
category = "general"
+++

Valkey has a different evolution path in the key-value DBs where values can contain more complex data types, with atomic operations defined on those data types. Valkey data types are closely related to fundamental data structures and are exposed to the programmer as such, without additional abstraction layers.

Valkey is an in-memory but persistent on disk database, so it represents a different trade off where very high write and read speed is achieved with the limitation of data sets that can't be larger than memory. Another advantage of in-memory databases is that the memory representation of complex data structures is much simpler to manipulate compared to the same data structures on disk, so Valkey can do a lot with little internal complexity. 
