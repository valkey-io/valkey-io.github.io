---
title: "CLUSTER KEYSLOT"
description: "CLUSTER KEYSLOT command reference documentation"
---

Returns an integer identifying the hash slot the specified key hashes to.
This command is mainly useful for debugging and testing, since it exposes
via an API the underlying Valkey implementation of the hashing algorithm.
Example use cases for this command:

1. Client libraries may use Valkey in order to test their own hashing algorithm, generating random keys and hashing them with both their local implementation and using Valkey `CLUSTER KEYSLOT` command, then checking if the result is the same.
2. Humans may use this command in order to check what is the hash slot, and then the associated Valkey Cluster node, responsible for a given key.

## Example

```
> CLUSTER KEYSLOT somekey
(integer) 11058
> CLUSTER KEYSLOT foo{hash_tag}
(integer) 2515
> CLUSTER KEYSLOT bar{hash_tag}
(integer) 2515
```

Note that the command implements the full hashing algorithm, including support for [hash tags](../topics/cluster-spec.md#hash-tags), that is the special property of Valkey Cluster key hashing algorithm, of hashing just what is between `{` and `}` if such a pattern is found inside the key name, in order to force multiple keys to be handled by the same node.
