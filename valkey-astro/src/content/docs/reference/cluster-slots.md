---
title: "CLUSTER SLOTS"
description: "CLUSTER SLOTS command reference documentation"
---

`CLUSTER SLOTS` returns details about which cluster slots map to which Valkey instances. 
The command is suitable to be used by Valkey Cluster client libraries implementations in order to retrieve (or update when a redirection is received) the map associating cluster *hash slots* with actual nodes network information, so that when a command is received, it can be sent to what is likely the right instance for the keys specified in the command. 

The networking information for each node is an array containing the following elements:

* Preferred endpoint (Either an IP address, hostname, or NULL)
* Port number
* The node ID
* A map of additional networking metadata

The preferred endpoint, along with the port, defines the location that clients should use to send requests for a given slot.
A NULL value for the endpoint indicates the node has an unknown endpoint and the client should connect to the same endpoint it used to send the `CLUSTER SLOTS` command but with the port returned from the command.
This unknown endpoint configuration is useful when the Valkey nodes are behind a load balancer that Valkey doesn't know the endpoint of.
Which endpoint is set as preferred is determined by the `cluster-preferred-endpoint-type` config.
An empty string `""` is another abnormal value of the endpoint field, as well as for the ip field, which is returned if the node doesn't know its own IP address.
This can happen in a cluster that consists of only one node or the node has not yet been joined with the rest of the cluster.
The value `?` is displayed if the node is incorrectly configured to use announced hostnames but no hostname is configured using `cluster-announce-hostname`.
Clients may treat the empty string in the same way as NULL, that is the same endpoint it used to send the current command to, while `"?"` should be treated as an unknown node, not necessarily the same node as the one serving the current command.

Additional networking metadata is provided as a map on the fourth argument for each node. 
The following networking metadata may be returned:

* `ip`: When the preferred endpoint is not set to IP.
* `hostname`: When a node has an announced hostname but the primary endpoint is not set to hostname.
* `availability-zone`: When the node has a non-empty `availability-zone` configuration value. This key is omitted when the value is empty.

## Nested Result Array
Each nested result is:

  - Start slot range
  - End slot range
  - Primary for slot range represented as nested networking information
  - First replica of primary for slot range
  - Second replica
  - ...continues until all replicas for this primary are returned.

Each result includes all active replicas of the primary instance
for the listed slot range. Failed replicas are not returned.

The command response is deterministic across all nodes in a cluster, which means that if two nodes return the same response they have the same view of the cluster.
Primaries are ordered by the slots they serve and then replicas are ordered lexicographically by the node-id they were assigned by the cluster. 
The third nested reply is guaranteed to be the networking information of the primary instance for the slot range.
All networking information after the third nested reply are replicas of the primary.

If a cluster instance has non-contiguous slots (e.g. 1-400,900,1800-6000) then primary and replica networking information results will be duplicated for each top-level slot range reply.

```
> CLUSTER SLOTS
1) 1) (integer) 0
   2) (integer) 5460
   3) 1) "127.0.0.1"
      2) (integer) 30001
      3) "09dbe9720cda62f7865eabc5fd8857c5d2678366"
      4) 1) hostname
         2) "host-1.valkey.example.com"
         3) availability-zone
         4) "zone-a"
   4) 1) "127.0.0.1"
      2) (integer) 30004
      3) "821d8ca00d7ccf931ed3ffc7e3db0599d2271abf"
      4) 1) hostname
         2) "host-2.valkey.example.com"
         3) availability-zone
         4) "zone-a"
2) 1) (integer) 5461
   2) (integer) 10922
   3) 1) "127.0.0.1"
      2) (integer) 30002
      3) "c9d93d9f2c0c524ff34cc11838c2003d8c29e013"
      4) 1) hostname
         2) "host-3.valkey.example.com"
         3) availability-zone
         4) "zone-a"
   4) 1) "127.0.0.1"
      2) (integer) 30005
      3) "faadb3eb99009de4ab72ad6b6ed87634c7ee410f"
      4) 1) hostname
         2) "host-4.valkey.example.com"
         3) availability-zone
         4) "zone-a"
3) 1) (integer) 10923
   2) (integer) 16383
   3) 1) "127.0.0.1"
      2) (integer) 30003
      3) "044ec91f325b7595e76dbcb18cc688b6a5b434a1"
      4) 1) hostname
         2) "host-5.valkey.example.com"
         3) availability-zone
         4) "zone-a"
   4) 1) "127.0.0.1"
      2) (integer) 30006
      3) "58e6e48d41228013e5d9c1c37c5060693925e97e"
      4) 1) hostname
         2) "host-6.valkey.example.com"
         3) availability-zone
         4) "zone-a"
```

**Warning:** In future versions there could be more elements describing the node better.
In general a client implementation should just rely on the fact that certain parameters are at fixed positions as specified, but more parameters may follow and should be ignored.
Similarly a client library should try if possible to cope with the fact that older versions may just have the primary endpoint and port parameter.
