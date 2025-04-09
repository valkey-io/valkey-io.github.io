+++
title = "Client Libraries"
template = "client-list.html"
[extra]
recommended_clients_paths = [
    "/python/valkey-GLIDE.json",
    "/python/valkey-py.json",
    "/node.js/valkey-GLIDE.json",
    "/node.js/iovalkey.json",
    "/java/valkey-GLIDE.json",
    "/java/valkey-java.json",
    "/go/valkey-GLIDE.json",
    "/go/valkey-go.json",
    "/php/phpredis.json",
    "/php/predis.json",
    ] 

client_fields =[
    "name",
    "language",
    "read_from_replica",
    "smart_backoff_to_prevent_connection_storm",
    "pubsub_state_restoration",
    "cluster_scan",
    "latency_based_read_from_replica",
    "AZ_based_read_from_replica",
    "client_side_caching",
    "client_capa_redirect",
    "persistent_connection_pool"
    ]

+++

This page offers an overview of recommended Valkey clients for various programming languages. A table of advanced features supported by the respective clients is provided, highlighting the unique advantages of one client over another.

This page includes only clients which are regularly tested and recommended. However, it's important to note that other clients that support Redis OSS version 7.2 are compatible with Valkey 7.2 and above. To add your client to the list, please refer to [this link.](https://github.com/valkey-io/valkey-doc/blob/main/clients/README.md)

<!-- split -->

Advanced Features Overview
-----

1. **Read from Replica** - The ability to read data from a replica node, which can be useful for load balancing and reducing the load on the primary node. This feature is particularly important in read-heavy applications.

2. **Smart Backoff to Prevent Connection Storm** - A strategy used to prevent connection storms by progressively updating the wait time between retries when attempting to reconnect to a Valkey server. This helps to reduce the load on the server during topology updates, periods of high demand or network instability.

3. **PubSub State Restoration** - The ability to restore the state of Pub/Sub (publish/subscribe) channels after a client reconnects. This feature ensures that clients can continue receiving messages after disconnections or topology updates such as adding or removing shards, for both legacy Pub/Sub and sharded Pub/Sub. The client will automatically resubscribe the connections to the new node. The advantage is that the application code is simplified, and doesn’t have to take care of resubscribing to new nodes during reconnects.

4. **Cluster Scan** - This feature ensures that the user experience and guarantees for scanning a cluster are identical to those for scanning a single node. The SCAN function operates as a cursor-based iterator. With each command, the server provides an updated cursor, which must be used as the cursor argument in subsequent calls. A complete iteration with SCAN retrieves all elements present in the collection from start to finish. If an element exists in the collection at the beginning and remains until the end of the iteration, SCAN will return it. Conversely, any element removed before the iteration begins and not re-added during the process will not be returned by SCAN. A client supporting this feature ensures the scan iterator remains valid even during failovers or cluster scaling (in or out) during the SCAN operation. 

5. **Latency-Based Read from Replica** - This feature enables reading data from the nearest replica, i.e., the replica that offers the best latency. It supports complex deployments where replicas are distributed across various distances, including different geographical regions, to ensure data is read from the closest replica, thereby minimizing latency.

6. **AZ-Based Read from Replica** - This feature enables reading data from replicas within the same Availability Zone (AZ). When running Valkey in a cloud environment across multiple AZs, it is preferable to keep traffic localized within an AZ to reduce costs and latency. By reading from replicas in the same AZ as the client, you can optimize performance and minimize cross-AZ data transfer charges. For more detailed information about this feature and its implementation, please refer to [this link.](https://github.com/valkey-io/valkey/pull/700)

7. **Client Side Caching** - Valkey client-side caching is a feature that allows clients to cache the results of Valkey queries on the client-side, reducing the need for frequent communication with the Valkey server. This can significantly improve application performance by lowering latency, reducing the network usage and cost and reducing the load on the Valkey server. 

8. **`CLIENT CAPA redirect` Support** - The `CLIENT CAPA redirect` feature was introduced in Valkey 8 to facilitate seamless upgrades without causing errors in standalone mode. When enabled, this feature allows the replica to redirect data access commands (both read and write operations) to the primary instance. This ensures uninterrupted service during the upgrade process. For more detailed information about this feature, please refer to [this link.](https://github.com/valkey-io/valkey/pull/325)

9. **Persistent Connection Pool** - This feature enables the Valkey client to maintain a pool of persistent connections to the Valkey server, improving performance and reducing overhead. Instead of establishing a new connection for each request, the client can reuse existing connections from the pool, minimizing the time and resources required for connection setup.