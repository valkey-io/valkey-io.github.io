+++
title = "What is the maximum number of keys a single Valkey instance can hold? What is the maximum number of elements in a Hash, List, Set, and Sorted Set?"
weight = 1
[extra]
question = "What is the maximum number of keys a single Valkey instance can hold? What is the maximum number of elements in a Hash, List, Set, and Sorted Set?"
category = "limitations"
+++

Valkey can handle up to 2<sup>32</sup> keys, and was tested in practice to handle at least 250 million keys per instance.

Every hash, list, set, and sorted set, can hold 2<sup>32</sup> elements.

In other words your limit is likely the available memory in your system. 
