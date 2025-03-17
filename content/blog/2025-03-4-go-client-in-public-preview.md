+++
title= "Introducing the Valkey Glide Go Client: Now in Public Preview!"
description = "Valkey Glide now supports GO. Read to learn more about the new client designed for performance and developer productivity"
date= 2025-03-04 01:01:01
authors= [ "niharikabhavaraju"]
+++

Valkey-Glide is pleased to announce the public preview release of the GLIDE(General Language Independent Driver for the Enterprise) Go client. This release brings the power and reliability of Valkey to Go developers with an API designed for performance and developer productivity.

Valkey GLIDE is a multi-language client for Valkey, designed for operational excellence and incorporating best practices refined through years of experience. GLIDE ensures a consistent and unified client experience across applications, regardless of the programming language.

Currently, GLIDE supports Java, Node.js, and Python. This announcement introduces the Valkey GLIDE support for Go, expanding support to Go developers and providing new connectivity to Valkey servers, including both standalone and cluster deployments.

## Why You Should Be Excited

The Go client extends Valkey GLIDE to the Go community, offering a robust, client that's built on the battle-tested Rust core. This client library is a thoughtfully designed experience for Go developers who need reliable, high-performance data access.

## Key Features

### Advanced Cluster Topology Management

Connect to your Valkey cluster with minimal configuration. The client automatically detects the entire cluster topology and configures connection management based on industry best practices.

```go
config := api.NewGlideClusterClientConfiguration().
    WithAddress(&api.NodeAddress{Host: "localhost", Port: 6379})

client, err := api.NewGlideClusterClient(config)
```

The Go client provides advanced topology managements features such as:

#### Automatic Topology Discovery

GLIDE automatically discovers all cluster nodes from a single seed node, eliminating the need to manually configure every node address. The NodeAddress can be an IP address, hostname, or fully qualified domain name (FQDN).

#### Dynamic Topology Maintenance

Cluster topology can change over time as nodes are added, removed, or when slot ownership changes. GLIDE implements several mechanisms to maintain an accurate view of the cluster:

- **Proactive Topology Monitoring**: GLIDE performs periodic background checks for cluster topology changes. This approach ensures a comprehensive and up-to-date view of the cluster, improving availability and reducing tail latency.
- **Consensus-Based Resolution**: GLIDE queries multiple nodes for their topology view and selects the one with the highest agreement, reducing the risk of stale or incorrect mappings and ensuring a more accurate and up-to-date cluster view, improving the overall availability of the cluster.
- **Efficient Resource Management**: GLIDE employs an efficient algorithm to compare node views and dynamically throttles client-management requests to prevent overloading Valkey servers, ensuring a balance between maintaining an up-to-date topology map and optimizing resource utilization.

### Enhanced Connection Management

Connection management in distributed systems presents unique challenges that impact performance, reliability, and resource utilization. The Go client addresses these challenges with reliable solutions:

#### Proactive Reconnection

GLIDE implements a background monitoring system for connection states. By detecting disconnections and initiating reconnections preemptively, the client eliminates the reconnection latency typically experienced when a request discovers a broken connection.

#### Connection Storm Prevention

When network events occur, connection storms can overwhelm servers with simultaneous reconnection attempts. GLIDE mitigates this risk through backoff algorithm with jitter that distributes reconnection attempts over time, protecting servers from sudden connection surges.

Robust connection handling with automatic reconnection strategies ensures your application remains resilient even during network instability:

```go
// Configure a custom reconnection strategy with exponential backoff
config := api.NewGlideClientConfiguration().
    WithAddress(&api.NodeAddress{Host: "localhost", Port: 6379}).
    WithReconnectStrategy(api.NewBackoffStrategy(
        5, // Initial delay in milliseconds
        10, // Maximum attempts
        50 // Maximum delay in milliseconds
    ))
```

#### Multiplexed Connection

Rather than maintaining connection pools, GLIDE establishes a single multiplexed connection per cluster node. This architectural choice:

- Minimizes the total number of TCP connections to servers
- Reduces system call overhead
- Maintains high throughput through efficient connection pipelining
- Decreases server-side connection management burden

### Built for Performance

The Go client is designed from the ground up with performance in mind while still being simple to use.
The Go client provides a synchronous API for simplicity and compatibility with existing Go key-value store clients. While each individual command is blocking (following the familiar patterns in the ecosystem), the client is fully thread-safe and designed for concurrent usage:

```go
// Example of concurrent execution using goroutines
func performConcurrentOperations(client *api.GlideClient) {
    var wg sync.WaitGroup
    
    // Launch 10 concurrent operations
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            key := fmt.Sprintf("key:%d", idx)
            value := fmt.Sprintf("value:%d", idx)
            
            // Each command blocks within its goroutine, but all 10 run concurrently
            _, err := client.Set(key, value)
            if err != nil {
                fmt.Printf("Error setting %s: %v\n", key, err)
                return
            }
            
            result, err := client.Get(key)
            if err != nil {
                fmt.Printf("Error getting %s: %v\n", key, err)
                return
            }
            
            fmt.Printf("Result for %s: %s\n", key, result)
        }(i)
    }
    
    wg.Wait()
}
```

Under the hood, the client efficiently handles these concurrent requests by:

1. Using a single multiplexed connection per node to pipeline concurrent commands, minimizing socket overhead and system resources
2. Implementing thread-safe command execution
3. Efficiently routing concurrent commands to the appropriate server nodes

While the current API is synchronous, the implementation is specifically optimized for concurrent usage through Go's native goroutines. We would love feedback about whether to add async/channel-based APIs in future releases.

## Getting Started

You can add Valkey GLIDE to your project with the following two commands:

```bash
go get github.com/valkey-io/valkey-glide/go
go mod tidy
```

Then, you can get started connecting to a Valkey standalone server, running locally on port 6379, with the following sample applications:

```go
package main

import (
    "fmt"
    "github.com/valkey-io/valkey-glide/go/api"
)

func main() {
    // Connect to a standalone Valkey server
    config := api.NewGlideClientConfiguration().
        WithAddress(&api.NodeAddress{Host: "localhost", Port: 6379})
    
    client, err := api.NewGlideClient(config)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer client.Close()
    
    // Test the connection
    result, err := client.Ping()
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(result) // PONG
    
    // Store and retrieve a value
    client.Set("hello", "valkey")
    value, _ := client.Get("hello")
    fmt.Println(value) // valkey
}
```

### Cluster Mode Connection Setup

Need to work with a Valkey cluster?

Just as easy! The Go client automatically discovers your entire cluster topology from a single seed node. The following sample shows how to connect to a Valkey cluster through a node running locally on port 7001:

```go
package main

import (
    "fmt"
    "github.com/valkey-io/valkey-glide/go/api"
)

func main() {
    // Specify the address of any single node in your cluster
    // This example connects to a local cluster node on port 7001
    host := "localhost"
    port := 7001
    
    // Connect to a Valkey cluster through any node
    config := api.NewGlideClusterClientConfiguration().
        WithAddress(&api.NodeAddress{Host: host, Port: port})
    
    client, err := api.NewGlideClusterClient(config)
    if err != nil {
        fmt.Println("There was an error: ", err)
        return
    }
    
    res, err := client.Ping()
    if err != nil {
        fmt.Println("There was an error: ", err)
        return
    }
    fmt.Println(res) // PONG
    client.Close()
}
```

## Advanced Configuration Options

### Read Strategies for Optimized Performance

Balance consistency and throughput with flexible read strategies:

```go
// Configure to prefer replicas for read operations
config := api.NewGlideClusterClientConfiguration().
    WithAddress(&api.NodeAddress{Host: "cluster.example.com", Port: 6379}).
    WithReadFrom(api.PreferReplica)

client, err := api.NewGlideClusterClient(config)

// Write to primary
client.Set("key1", "value1")

// Automatically reads from a replica (round-robin)
result, err := client.Get("key1")
```

Available strategies:

- **PRIMARY**: Always read from primary nodes for the freshest data
- **PREFER_REPLICA**: Distribute reads across replicas in round-robin fashion, falling back to primary when needed

Planned for future release:

- **AZ_AFFINITY**: (Coming soon) Prefer replicas in the same availability zone as the client

### Authentication and TLS

Secure your connections with built-in authentication and TLS support:

```go
// Configure with authentication
config := api.NewGlideClientConfiguration().
    WithAddress(&api.NodeAddress{Host: "localhost", Port: 6379}).
    WithCredentials(api.NewServerCredentials("username", "password")).
    WithUseTLS(true) // Enable TLS for encrypted connections
```

### Request Timeout and Handling

Fine-tune timeout settings for different workloads:

```go
// Set a longer timeout for operations that may take more time
config := api.NewGlideClientConfiguration().
    WithAddress(&api.NodeAddress{Host: "localhost", Port: 6379}).
    WithRequestTimeout(500) // 500ms timeout
```

## Behind the Scenes: Technical Architecture

The Valkey GLIDE Go client is built on top of the Valkey GLIDE core. The core framework is written in Rust (lib.rs), which exposes public functions. These functions are converted to a C header file using Cbindgen. The Go client then uses CGO to call these C functions, providing Go developers with an idiomatic interface while leveraging Rust's performance advantages. This architecture ensures consistent behavior across all Valkey GLIDE language implementations (Java, Python, Node.js, and Go) while maintaining performance and reliability.

### Component details
```text
+------------+      +------+      +------------+      +------------+      +------------+
|            |      |      |      |            |      |            |      |            |
|    Go      |----->|      |----->|  C Header  |----->|    Rust    |----->|   Valkey   |
|  Client    |      |  CGO |      |  cbindgen  |      |    Core    |      |   Server   |
|            |<-----|      |<-----|            |<-----|            |<-----|            |
|            |      |      |      |            |      |            |      |            |
+------------+      +------+      +------------+      +------------+      +------------+
```

- **Go Client**: The language-specific interface for Go developers
- **CGO**: Allows Go code to call C functions
- **Cbindgen**: Automates the generation of C header files from Rust public APIs
- **Rust Core**: High-performance framework that connects to and communicates with Valkey servers
- **Rust FFI Library**: Enables cross-language function calls between Rust and other languages

## Join the Journey

This public preview is just the beginning. We're actively developing and enhancing the Go wrapper, and we'd love your feedback and contributions. Try it out in your projects, share your experiences, and help us make it even better!
You can join our development journey by:

- Submitting issues or feature requests on our [GitHub Issues page](https://github.com/valkey-io/valkey-glide/issues)
- Joining discussions in our [GitHub Discussions forum](https://github.com/valkey-io/valkey-glide/discussions)

## Looking Forward

As we move toward general availability, we'll be expanding command support, enhancing performance, and adding even more features to make the Valkey GLIDE Go client a great choice for Go developers.


Checkout our [Valkey GLIDE go client](https://github.com/valkey-io/valkey-glide/tree/main/go) for the source code.
For implementation examples, please refer to the [README of the Go examples](https://github.com/valkey-io/valkey-glide/blob/main/go/README.md) for instructions on running the Standalone and Cluster examples.

For a complete reference of all available commands and their parameters, explore the [Go API documentation on pkg.go.dev](https://pkg.go.dev/github.com/valkey-io/valkey-glide/go/api), which provides detailed information on method signatures, parameters, and return types.

## Contributors

A huge thank you to all the contributors who have made this possible - your dedication and expertise have created something truly special for the Go community.

[Janhavi Gupta](https://github.com/janhavigupta007) (Google Cloud Platform)

[Niharika Bhavaraju](https://github.com/niharikabhavaraju) (Google Cloud Platform)

[Edric Cuartero](https://github.com/EdricCua) (Google Cloud Platform)

[Omkar Mestry](https://github.com/omangesg) (Google Cloud Platform)

[Yury Fridlyand](https://github.com/Yury-Fridlyand) (Improving)

[Prateek Kumar](https://github.com/prateek-kumar-improving) (Improving)

Kudos to [Aaron Congo](https://github.com/aaron-congo) who created the backbone of the client 🚀 and to [Umit Unal](https://github.com/umit), [Michael](https://github.com/MikeMwita) for their contributions!
