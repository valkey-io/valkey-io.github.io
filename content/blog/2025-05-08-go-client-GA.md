+++
title= "Valkey GLIDE Go Client: Now Generally Available!"
description = "Valkey GLIDE Go client reaches general availability. Read to learn more about the go client designed for performance and developer productivity"
date= 2025-05-08 01:01:01
authors= [ "niharikabhavaraju", "jbrinkman"]
+++

The Valkey GLIDE contributors are pleased to announce the general availability (GA) release of the Valkey GLIDE Go client. This release brings the power and reliability of Valkey to Go developers with an API designed for performance and developer productivity.

Vakey GLIDE 2.0 brings exciting new features for all of our language clients (Java, Node.js, Python, and now Go). These features include pipelines, OpenTelemetry support, MacOS x86 support, and improved performance and bug fixes.

The Go client extends Valkey GLIDE to the Go community, offering a robust client that's built on the battle-tested Rust core. This client library is a thoughtfully designed experience for Go developers who need reliable, high-performance data access.

## What's new in GA?

- The major addition in the GA release is comprehensive [batch support](#batch-support) that includes both transactions and pipelines.
- Complete support for all Valkey commands encompassing scripting, functions, pubsub, server management, and all other operations in both standalone and cluster modes.
- Support for OpenTelemetry tracing which has been added to all language clients, including Go.
- Go context support for all commands and batch operations.

## Key Features

### Advanced Cluster Topology Management

Connect to your Valkey cluster with minimal configuration. The client automatically detects the entire cluster topology and configures connection management based on industry best practices.

```go
cfg := config.NewClusterClientConfiguration().
    WithAddress(&config.NodeAddress{Host: "localhost", Port: 6379})

client, err := glide.NewClusterClient(cfg)
```

The Go client provides advanced topology managements features such as:

#### Automatic Topology Discovery

GLIDE automatically discovers all cluster nodes from a single seed node, eliminating the need to manually configure every node address. The NodeAddress can be an IP address, hostname, or fully qualified domain name (FQDN).

#### Dynamic Topology Maintenance

Cluster topology can change over time as nodes are added, removed, or when slot ownership changes. GLIDE implements several features to maintain an accurate view of the cluster:

- **Proactive Topology Monitoring**: GLIDE performs periodic background checks for cluster topology changes. This approach ensures a comprehensive and up-to-date view of the cluster, improving availability and reducing tail latency.
- **Consensus-Based Resolution**: GLIDE queries multiple nodes for their topology view and selects the one with the highest agreement, reducing the risk of stale or incorrect mappings and ensuring a more accurate and up-to-date cluster view, improving the overall availability of the cluster.
- **Efficient Resource Management**: GLIDE employs an efficient algorithm to compare node views and dynamically throttles client-management requests to prevent overloading Valkey servers, ensuring a balance between maintaining an up-to-date topology map and optimizing resource utilization.

### Enhanced Connection Management

Connection management in distributed systems presents unique challenges that impact performance, reliability, and resource utilization. The Go client addresses these challenges with reliable solutions:

#### Proactive Reconnection

GLIDE implements a background monitoring system for connection states. By detecting disconnections and initiating reconnections preemptively, the client eliminates the reconnection latency typically experienced when a request discovers a broken connection.

#### Connection Storm Prevention

When network events occur, connection storms can overwhelm servers with simultaneous reconnection attempts. GLIDE mitigates this risk through a backoff algorithm with jitter that distributes reconnection attempts over time, protecting servers from sudden connection surges.

Robust connection handling with automatic reconnection strategies ensures your application remains resilient even during network instability:

```go
// Configure a custom reconnection strategy with exponential backoff
cfg := config.NewClientConfiguration().
    WithAddress(&config.NodeAddress{Host: "localhost", Port: 6379}).
    WithReconnectStrategy(config.NewBackoffStrategy(
        5, // Number of retry attempts, with increasing backoff between attempts.
        10, // Multiplier that will be applied to the delay between attempts.
        2 // Exponent base configured for the backoff strategy.
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
The Go client provides a synchronous API for simplicity and compatibility with existing Golang key-value store clients. While each individual command is blocking (following the familiar patterns in the ecosystem), the client is fully thread-safe and designed for concurrent usage:

```go
// Example of concurrent execution using goroutines
func performConcurrentOperations(client *glide.Client) {
    var wg sync.WaitGroup
    
    // Launch 10 concurrent operations
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            key := fmt.Sprintf("key:%d", idx)
            value := fmt.Sprintf("value:%d", idx)
            
            // Each command blocks within its goroutine, but all 10 run concurrently
            _, err := client.Set(context.Background(), key, value)
            if err != nil {
                fmt.Printf("Error setting %s: %v\n", key, err)
                return
            }
            
            result, err := client.Get(context.Background(), key)
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

1. Using a single multiplexed connection per node to pipeline concurrent commands, minimizing socket overhead and system resources,
2. Implementing thread-safe command execution,
3. Efficiently routing concurrent commands to the appropriate server nodes.

While the current API is synchronous, the implementation is specifically optimized for concurrent usage through Go's native goroutines. We would love feedback about whether to add async/channel-based APIs in future releases, or anything else you think could help improve Valkey GLIDE. You can create an issue on our [GitHub repository](https://github.com/valkey-io/valkey-glide/issues) to request a feature or report a bug, or start a discussion in our [GitHub Discussions forum](https://github.com/valkey-io/valkey-glide/discussions) to share your thoughts.

## Getting Started

You can add Valkey GLIDE to your project with the following two commands:

```bash
go get github.com/valkey-io/valkey-glide/go/v2
go mod tidy
```

Then, you can get started connecting to a Valkey standalone server, running locally on port 6379, with the following sample code:

```go
package main

import (
    "fmt"
    glide "github.com/valkey-io/valkey-glide/go/v2"
    "github.com/valkey-io/valkey-glide/go/v2/config"
)

func main() {
    // Connect to a standalone Valkey server
    cfg := config.NewClientConfiguration().
        WithAddress(&config.NodeAddress{Host: "localhost", Port: 6379})
    
    client, err := glide.NewClient(cfg)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer client.Close()
    
    // Test the connection
    result, err := client.Ping(context.Background())
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(result) // PONG
    
    // Store and retrieve a value
    client.Set(context.Background(), "hello", "valkey")
    value, _ := client.Get(context.Background(), "hello")
    fmt.Println(value) // valkey
}
```

### Cluster Mode Connection Setup

Valkey GLIDE makes it just as easy to work with a Valkey cluster! The Go client automatically discovers your entire cluster topology from a single seed node. The following sample shows how to connect to a Valkey cluster through a node running locally on port 7010:

```go
package main

import (
    "fmt"
    glide "github.com/valkey-io/valkey-glide/go/v2"
    "github.com/valkey-io/valkey-glide/go/v2/config"
)

func main() {
    // Specify the address of any single node in your cluster
    // This example connects to a local cluster node on port 7010
    host := "localhost"
    port := 7010
    
    // Connect to a Valkey cluster through any node
    cfg := config.NewClusterClientConfiguration().
        WithAddress(&config.NodeAddress{Host: host, Port: port})
    
    client, err := glide.NewClusterClient(cfg)
    if err != nil {
        fmt.Println("There was an error: ", err)
        return
    }
    
    res, err := client.Ping(context.Background())
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
cfg := config.NewClusterClientConfiguration().
    WithAddress(&config.NodeAddress{Host: "cluster.example.com", Port: 6379}).
    WithReadFrom(config.PreferReplica)

client, err := glide.NewClusterClient(cfg)

// Write to primary
client.Set(context.Background(), "key1", "value1")

// Automatically reads from a replica (round-robin)
result, err := client.Get(context.Background(), "key1")
```

Available strategies:

- **Primary**: Always read from primary nodes for the freshest data
- **PreferReplica**: Distribute reads across replicas in round-robin fashion, falling back to primary when needed
- **AzAffinity**: Prefer replicas in the same availability zone as the client
- **AzAffinityReplicaAndPrimary**: Spread the read requests among nodes within the client's availability zone in a round-robin manner

### Authentication and TLS

Secure your connections with built-in authentication and TLS support:

```go
// Configure with authentication
cfg := config.NewClientConfiguration().
    WithAddress(&config.NodeAddress{Host: "localhost", Port: 6379}).
    WithCredentials(config.NewServerCredentials("username", "password")).
    WithUseTLS(true) // Enable TLS for encrypted connections
```

### Request Timeout and Handling

Fine-tune timeout settings for different workloads:

```go
// Set a longer timeout for operations that may take more time
cfg := config.NewClientConfiguration().
    WithAddress(&config.NodeAddress{Host: "localhost", Port: 6379}).
    WithRequestTimeout(500) // 500ms timeout
```

## Behind the Scenes: Technical Architecture

The Valkey GLIDE Go client is built on top of the Valkey GLIDE core. The core framework is written in Rust (lib.rs), which exposes public functions. These functions are converted to a C header file using Cbindgen. The Go client then uses CGO to call these C functions, providing Go developers with an idiomatic interface while leveraging Rust's performance advantages. This architecture ensures consistent behavior across all Valkey GLIDE language implementations (Java, Python, Node.js, and Go) while maintaining performance and reliability.

### Component details

```text
+------------+      +------+      +------------+      +------------+      +------------+
|            |      |      |      |            |      |            |      |            |
|    Go      |----->|      |----->|    FFI     |----->|    Rust    |----->|   Valkey   |
|  Client    |      |  CGO |      |  Library   |      |    Core    |      |   Server   |
|            |<-----|      |<-----|            |<-----|            |<-----|            |
|            |      |      |      |            |      |            |      |            |
+------------+      +------+      +------------+      +------------+      +------------+
```

- **Go Client**: The language-specific interface for Go developers
- **CGO**: Allows Go code to call C functions
- **Rust FFI Library**: Enables cross-language function calls between Rust and other languages
- **Rust Core**: High-performance framework that connects to and communicates with Valkey servers


## Batch Support

The Go client now includes full batch support, including transactions and pipelines, enabling atomic and non-atomic operations across multiple commands.

### Batch Lifecycle

**Create Batch:**

Define a new batch using `pipeline.NewStandaloneBatch(isAtomic)` or `pipeline.NewClusterBatch(isAtomic)` to begin the process of creating a batch. `isAtomic` is a boolean that determines whether the batch should be executed atomically using Valkey's transaction features, or executed non-atomically using the pipeline functionality. This pipeline feature is new for all languages in Valkey GLIDE 2.0 and provides even greater performance where atomicity is not required.

```go
    // Create a new transaction
    batch := pipeline.NewStandaloneBatch(true) // Atomic batch == transaction
```

**Queue Commands:**

 Queue commands in the order they should be executed. The batch API supports chaining commands together to build a sequence of operations. This sequence definition is added to the batch but not immediately executed.

**Example:**

```go
    batch.Set("key1","val1").Get("key1")
```

**Execute Batch:**

 Run all queued commands
 After queueing the commands, a batch can be executed with `client.Exec()`
 All the queued commands will be executed and return a response array which consists of the command results. Since the batch definition is separate from the execution, you can re-execute the same batch against different clients providing added flexibility.

## Standalone Mode Batch

```go
    // Standalone BatchClient Example
	cfg := config.NewClientConfiguration().
		WithAddress(&config.NodeAddress{Host: "localhost", Port: 6379})

	client, err := NewClient(cfg)
	if err != nil {
		log.Fatal("error connecting to database: ", err)
	}
	defer client.Close()

	// Create new transaction
	tx := pipeline.NewStandaloneBatch(true).
		Set("user:profile", "John Doe").
		Set("user:email", "john@example.com").
		SAdd("users", []string{"john"})

	// Command sequence
	txs := []string{"Set - user:profile", "Set - user:email", "SAdd - users"}

	// Execute transaction
	results, err := client.Exec(context.Background(), *tx, false) // false = process all commands and include errors as part of the response array
	if err != nil {
		log.Printf("Transaction failed: %v", err)
		return
	}

	// Process results
	for i, result := range results {
		fmt.Printf("Command %s results: %v\n", txs[i], result)
	}
```

## Cluster mode Batch

Cluster batches are similar to standalone batches, but they are executed on a cluster client. They may have specific routing options to control which node the commands are executed on. In a cluster batch, all commands are executed on the same node, unless the IsAtomic flag is set to false (i.e. is a pipeline and not a transaction), in which case the commands may be split based on the key slot. Once all commands have been executed, the results (including any errors) are returned to the client. For pipelines, the results are returned in the same order as the commands were queued, even when the commands are executed on different nodes.

```go
	// Cluster BatchClient Example
    // Only a single node is required to connect to the Cluster
	cfg := config.NewClusterClientConfiguration().
		WithAddress(&config.NodeAddress{Host: "localhost", Port: 7010})

	clusterClient, err := NewClusterClient(cfg)
	if err != nil {
		log.Fatal("error connecting to cluster: ", err)
	}
	defer clusterClient.Close()

	// Create new transaction
	clusterTx := pipeline.NewClusterBatch(true)

	// Create ping options with specific routing
	pingOpts := options.PingOptions{
		Message: "Hello Valkey Cluster",
	}

	// Queue commands with routing
	clusterTx.PingWithOptions(pingOpts)

	// Command sequence
	txs := []string{"Ping - 'Hello Valkey Cluster'"}

	opts := pipeline.NewClusterBatchOptions().
		WithRoute(config.RandomRoute)

	// Execute transaction
	results, err := clusterClient.ExecWithOptions(context.Background(), *clusterTx, false, *opts)
	if err != nil {
		log.Printf("Cluster transaction failed: %v", err)
		return
	}

	// Process results
	for i, result := range results {
		fmt.Printf("Command %s results: %v\n", txs[i], result)
	}
```

## Batch design

The batch implementation in Valkey GLIDE was designed with several key goals, each achieved through specific implementation approaches:

### Idiomatic Go API

The design provides a natural, Go-like interface for batches through:

- Clean command calling syntax (`tx.Set(...)`, `tx.Get(...)`)
- Use of Go's embedding to inherit behavior from `BaseBatch`
- Explicit error handling that follows Go conventions (`result, err := pipeline.Exec()`)
- Use of method chaining to efficiently build command sequences (e.g. `tx.Set(...).Set(...).SAdd(...)`)
- Use of Go context for timeout and cancellation support 

### Command Transparency

A important principle in the design of the client was transparently accessing the command, in both regular and batch contexts. While the server-side command execution is the same, the client-side result and error handling will differ since the batch results must account for multiple commands and potential errors. Go context is passed when the command is executed: with regular clients this occurs when the command is called, and in batches this occurs when the batch is executed. In batches, Cluster mode and standalone mode commands are the same with only a few exceptions for Select, Move, Scan, and PubSub commands. This is slightly different from regular contexts where some commands may have specific routing options that are available when using the ClusterClient.

```go
// In regular client context
client := glide.NewClient(...)
// Executes immediately with context
client.Set(context.Background(), "key1", "value1")

// In transaction context 
tx := pipeline.NewStandaloneBatch(true)
// Queued for later execution
tx.Set("key1", "value1")
// Execute transaction with context
results, err := client.Exec(context.Background(), *tx, false)
```

### Optimistic Concurrency Support

Valkey's optimistic locking mechanism is supported through:

- Implementation of `Watch()` that monitors keys for changes,
- Implementation of `Unwatch()` that releases monitoring,
- Proper handling of transaction failure when watched keys change,
- Passing watch state through to the Valkey server during execution.

This enables patterns like:

```go
client.Watch(context.Background(), []string{"key1"})
tx := pipeline.NewStandaloneBatch(true).
    Get("key1").
    Set("key1", "new-value")

// Will fail if key1 changed between Watch and Exec
raiseOnError := true
results, err := client.Exec(context.Background(), *tx, raiseOnError)
```

## Join the Journey

We're actively developing and enhancing the Go client, and we'd love your feedback and contributions. Try it out in your projects, share your experiences, and help us make it even better!
You can join our development journey by:

- Submitting issues or feature requests on our [GitHub Issues page](https://github.com/valkey-io/valkey-glide/issues)
- Joining discussions in our [GitHub Discussions forum](https://github.com/valkey-io/valkey-glide/discussions)

## Looking Forward

As we move forward, we'll continue enhancing performance, and adding even more features to the Valkey GLIDE Go client to continue building on the great foundation provided by Valkey GLIDE 2.0.

Checkout our [Valkey GLIDE go client](https://github.com/valkey-io/valkey-glide/tree/main/go) for the source code.
For more details on how to get started with Valkey GLIDE Go client, please refer to the [README](https://github.com/valkey-io/valkey-glide/blob/main/go/README.md) for instructions on running the Standalone and Cluster examples.

For a complete reference of all available commands and their parameters, explore the [Go API documentation on pkg.go.dev](https://pkg.go.dev/github.com/valkey-io/valkey-glide/go/v2), which provides detailed information on method signatures, parameters, and return types.

## Contributors

A huge thank you to all the contributors and community members who have made this possible - your dedication and expertise have created something truly special for the Go community.

[Bar Shaul](https://github.com/barshaul) (Amazon Web Services)

[Shoham Elias](https://github.com/shohamazon) (Amazon Web Services)

[Adar Ovadia](https://github.com/adarovadya) (Amazon Web Services)

[Meital Krasikow](https://github.com/meitalkra) (Amazon Web Services)

[Asaf Porat Stoler](https://github.com/asafpamzn) (Amazon Web Services)

[Janhavi Gupta](https://github.com/janhavigupta007) (Google Cloud Platform)

[Niharika Bhavaraju](https://github.com/niharikabhavaraju) (Google Cloud Platform)

[Edric Cuartero](https://github.com/EdricCua) (Google Cloud Platform)

[Omkar Mestry](https://github.com/omangesg) (Google Cloud Platform)

[Vikas Pandey](https://github.com/vikas) (Google Cloud Platform)

[Yury Fridlyand](https://github.com/Yury-Fridlyand) (Improving)

[Prateek Kumar](https://github.com/prateek-kumar-improving) (Improving)

[James Xin](https://github.com/jamesx-improving) (Improving)

[Jonathan Louie](https://github.com/jonathanl-bq) (Improving)

[TJ Zhang](https://github.com/tjzhang-BQ) (Improving)

[Joe Brinkman](https://github.com/jbrinkman) (Improving)

[Edward Liang](https://github.com/edlng) (Improving)

[Chloe Yip](https://github.com/cyip10) (Improving)

[YiPin Chen](https://github.com/yipin-chen) (Improving)

[Andrew](https://github.com/andrew)

Kudos to [Aaron Congo](https://github.com/aaron-congo) who created the backbone of the client 🚀, to [Umit Unal](https://github.com/umit) and [Michael](https://github.com/MikeMwita) for their early code contributions, and finally to [Marcin Dobosz](https://github.com/marcind) who provided invaluable community feedback and suggestions that pushed the team to keep improving on a daily basis!
