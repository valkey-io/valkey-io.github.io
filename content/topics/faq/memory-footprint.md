+++
title = "What's the Valkey memory footprint?"
weight = 1

[extra]
question = "What's the Valkey memory footprint?"
category = "memory-performance"
+++

To give you a few examples:

* An empty instance uses ~ 3MB of memory.
* 1 Million small Keys -> String Value pairs use ~ 85MB of memory.
* 1 Million Keys -> Hash value, representing an object with 5 fields, use ~ 160 MB of memory.

Testing your use case is trivial. Use the `valkey-benchmark` utility to generate random data sets then check the space used with the `INFO memory` command. 
