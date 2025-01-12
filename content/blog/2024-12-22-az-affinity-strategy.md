+++
title= "Reducing application latency and lowering Cloud bill by setting up your client library"
date= 2025-01-08 01:01:01
description= "By implementing AZ affinity routing in Valkey and using GLIDE, you can achieve lower latency and cost savings by routing requests to replicas in the same AZ as the client."
authors= [ "asafporatstoler", "adarovadya"]
+++
How can adjusting your client library help you reduce Cloud costs and improve latency?

In this post, we dive into **Availability Zone (AZ) affinity routing** mechanics, showing how it optimizes your application's performance and cost using **Valkey GLIDE (General Language Independent Driver for the Enterprise)**. We also guide you through how to configure GLIDE to benefit from other key features. 

GLIDE is an official open-source Valkey client library. GLIDE is designed for reliability, optimized performance, and high-availability, for Valkey and Redis-based applications. GLIDE is a multi-language client that supports Java, Python, and Node.js, with further languages in development. GLIDE recently added support for a key feature AZ affinity routing, which enables Valkey-based applications to direct calls specifically to server nodes in the same AZ as the client. This minimizes cross-AZ traffic, reduces latency, and lowers cloud expenses.

Before we explore AZ affinity routing, let’s understand what availability zones are, how different **read strategies** work and how they impact your application.

## Choosing the Right Read Strategy for Your Application

Distributed applications rely on scalability and resilience, often achieved by techniques like caching, sharding, and high availability. Valkey enhances these systems by acting as a robust caching layer, reducing database load and accelerating read operations. Its sharding capabilities distribute data across multiple nodes, ensuring efficient storage and access patterns, while its high availability features safeguard uptime by replicating data across the primary and replica nodes. This combination enables distributed applications to handle high traffic and recover quickly from failures, ensuring consistent performance.

In Valkey-based applications, selecting the right read strategy is required for optimizing performance and cost. Read strategies determine how read-only commands are routed, balancing factors like data freshness, latency, and throughput. 
Understanding the infrastructure that supports these strategies is key to leveraging them effectively.

**Availability Zones** are isolated locations within Cloud regions that provide redundancy and fault tolerance. They are physically separated but connected through low-latency networks. Major cloud providers like AWS, Oracle and GCP implement the concept of AZs. However, using resources across different AZs can incur increased latency and cost.
GLIDE takes advantage of this infrastructure by routing reads to replica nodes within the same AZ, enabling faster responses and improved user experience. 
This is particularly advantageous for applications that prioritize read throughput and can tolerate slightly stale data. For instance, websites with personalized recommendation engines rely on displaying content quickly to users rather than ensuring every update is perfectly synchronized.
Additionally, one of the most common use cases for caching is to store database query results, allowing applications to trade off absolute freshness for better performance, scalability, and cost-effectiveness. The read-from-replica strategies introduces minimal additional staleness, making it an efficient choice for such scenarios.
GLIDE provides flexible options tailored to your application’s needs:

* ```PRIMARY```: Always read from the primary to ensure the freshness of data.
* ```PREFER_REPLICA```: Distribute requests among all replicas in a round-robin manner. If no replica is available, fallback to the primary.
* ```AZ_AFFINITY```: Prioritize replicas in the same AZ as the client. If no replicas are available in the zone, fallback to other replicas or the primary if needed.

In Valkey 8,  ```availability-zone``` configuration was introduced, allowing clients to specify the AZ for each Valkey server. GLIDE leverages this new configuration to empower its users with the ability to use AZ Affinity routing. At the time of writing, GLIDE is the only Valkey client library supporting the AZ Affinity strategy, offering a unique advantage.

## AZ Affinity routing advantages

1. **Reduce Data Transfer Costs** Cross-zone data transfer often incurs additional charges in Cloud environments. By ensuring operations are directed to nodes within the same AZ, you can minimize or eliminate these costs.

    **Example:** An application in AWS with a Valkey cluster of 2 shards, each with 1 primary and 2 replicas, the instance type is m7g.xlarge. The cluster processes 250MB of data per second and to simplify the example 100% of the traffic is read operation. 50% of this traffic crosses AZs at a cost of $0.01 per GB, the monthly cross-AZ data transfer cost would be approximately $3,285. In addition the cost of the cluster is $0.252 per hour per node. Total of $1,088 per month. By implementing AZ affinity routing, you can reduce the total cost from $4,373 to $1,088, as all traffic remains within the same AZ.


2. **Minimize Latency** Distance between AZs within the same region— for example, in AWS, is typically up to 60 miles (100 kilometers)—adds extra roundtrip latency, usually in the range of 500µs to 1000µs. By ensuring requests remain within the same AZ, you can reduce latency and improve the responsiveness of your application.
    
    **Example:**
    Consider a cluster with three nodes, one primary and two replicas. Each node is located in a different availability zone. The client located in az-2 along with replica-1. 

    **With ```PREFER_REPLICA``` strategy**:
    In this case, the client will read commands from any replica that is available. It may be located in a different AZ as shown below, and the average latency is, for example, 800 microseconds.

    ![PREFER_REPLICA Read strategy latency example](/assets/media/pictures/PREFER_REPLICA_strategy.png)


    **With ```AZ_AFFINITY``` strategy**:
    In this case, the client will read commands from a replica in the same client's AZ and the average latency is, for example, about 300 microseconds.

    ![AZ_AFFINITY Read strategy latency example](/assets/media/pictures/AZ_AFFINITY_strategy.png)

## Configuring AZ Affinity Connections with GLIDE

Setting up AZ affinity routing in GLIDE is simple, allowing you to leverage its full potential with just a few configuration steps. Let’s walk through the steps to enable this feature in your application.

### Steps to Set Up AZ Affinity Routing in GLIDE

1. Configure Valkey nodes availability zone - 
    Assign each Valkey node to a specific AZ based on its physical or virtual location within the Cloud provider's region. 
    The initial configuration must to be done with a separate management client on node initialization, as the clients gets the info from the replicas on the first reconnect. 
    In some managed services like Amazon ElastiCache, this mapping is configured automatically and this step is not required. 

    For each node, run the following command and change the AZ and routing address as appropriate:

    **Python:**
    ```python
    client.config_set({"availability-zone": az}, 
                        route=ByAddressRoute(host="address.example.com", port=6379))
    ```
    **Java:**
    ```Java
    client.configSet(Map.of("availability-zone", az), new ByAddressRoute("address.example.com", 6379))
    ```
    **Node.js:**
    ```javascript
    client.configSet({"availability-zone": az}, { route: {type: "routeByAddress", host:"address.example.com", port:6379}})
    ```

2. Configure GLIDE with AZ-Specific Targeting - 
    Here are Python, Java, and Node.JS examples showing how to set up an AZ affinity client that directs calls to nodes in the same AZ as the client.
    
    **Python:**
    ```python
    from glide import (
        GlideClient,
        GlideClientConfiguration,
        NodeAddress,
        ReadFrom
    )

    # Determine the client's AZ (this could be fetched from the cloud provider's metadata service)
    client_az = 'us-east-1a'

    # Initialize Valkey client with preference for the client's AZ
    addresses = [NodeAddress(host="address.example.com", port=6379)]
    client_config = GlideClusterClientConfiguration(addresses, read_from=ReadFrom.AZ_AFFINITY, client_az=client_az)
    client = await GlideClusterClient.create(client_config)

    # Write operation (route to the primary's slot owner)
    client.set("key1", "val1")

    # Get will read from one of the replicas in the same client's availability zone if one exits.
    value = client.get("key1")
    ```
    **Java:**
    ```Java
    // Initialize Valkey client with preference for the client's AZ
    GlideClusterClientConfiguration config = GlideClusterClientConfiguration.builder()
        .address(NodeAddress.builder()
            .host("address.example.com")
            .port(6379)
            .build())
        .readFrom(ReadFrom.AZ_AFFINITY)
        .clientAZ("us-east-1a")
        .build()
    GlideClusterClient client = GlideClusterClient.createClient(config).get();

    // Write operation (route to the primary's slot owner)
    client.set("key1", "val1").get();

    // Get will read from one of the replicas in the same client's availability zone if one exits.
    client.get("key1").get();
    ```
    **Node.js:**
    ```javascript
    import GlideClusterClient from "@valkey/valkey-glide";

    const addresses = [
        {
            host: "address.example.com",
            port: 6379
        }
    ];

    // Initialize Valkey client with preference for the client's AZ
    const client = await GlideClusterClient.createClient({
        addresses: addresses,
        readFrom: "AZAffinity" as ReadFrom,
        clientAz: "us-east-1a",
    });
    // Write operation (route to the primary's slot owner)
    await client.set("key1", "val1");
    // Get will read from one of the replicas in the same client's availability zone if one exits.
    await client.get("key1");
    ```

## Conclusion
By implementing AZ affinity routing in Valkey and using GLIDE, you can achieve lower latency and cost savings by routing requests to replicas in the same AZ as the client.

### Further Reading
* [Valkey GLIDE GitHub Repository](https://github.com/valkey-io/valkey-glide)
* [Valkey Documentation](https://valkey.io/)
* [Valkey GLIDE read strategy documentation in Python](https://github.com/valkey-io/valkey-glide/wiki/Python-wrapper#read-strategy) 
* [Valkey GLIDE read strategy documentation in Java](https://github.com/valkey-io/valkey-glide/wiki/Java-Wrapper#read-strategy)
* [Valkey GLIDE read strategy documentation in NodeJS](https://github.com/valkey-io/valkey-glide/wiki/NodeJS-wrapper#read-strategy)
