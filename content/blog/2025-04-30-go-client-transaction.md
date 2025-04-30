+++
title= "Introducing the Transaction in Valkey Glide Go Client"
description = "Valkey Glide transaction in Valkey Glide Go Client. Read to learn more about how transaction is designed for Go client"
date= 2025-04-30 01:01:01
authors= [ "niharikabhavaraju"]
+++

Introducing Transaction for Valkey GLIDE Go client

 Valkey GLIDE Go client provides a comprehensive transaction support, enabling developers to execute multiple commands atomically across standalone and cluster environments.  
Transactions provide a mechanism for executing multiple commands atomically, ensuring data integrity and consistency in distributed systems.

## Key Concepts

### What are transactions?

Transactions in Valkey allow the execution of a group of commands  in a single step. They ensure all operations are  executed sequentially, with no other client requests served in the middle of the transaction, guaranteeing the operations are executed as a single isolated unit.

### Transaction Lifecycle

**Create Transaction:**

 Initialize a transaction object.
Use `api.NewTransaction(client)` to create a new transaction with established client as an argument
`cmd := tx.GlideClient` grants access to a transaction-scoped commands interface, allowing you to construct a sequence of operations to be executed. We can access transaction commands via the embedded client.

**Queue Commands:**

 Queue commands in the order they should be executed.
Each queued command is added to the transaction but not immediately executed..
`cmd.CommandName` allows you to queue multiple transactions ,
**Example:**

```go
cmd.Set("key1","val1")
cmd.Get("key1")
```

**Execute Transaction:**
 Run all queued commands atomically
 After queueing the commands, transaction can be executed with `tx.Exec()`
 All the queued commands will be executed and returns an response array which consists of the commands result.

## Standalone Mode Transaction

```go
// Standalone Client Transaction
package main

import (
    "fmt"
    "log"
    "github.com/valkey-io/valkey-glide/go/api"
)

func main() {
    config := api.NewGlideClientConfiguration().
        WithAddress(&api.NodeAddress{Host: "localhost", Port: 6379})

    client, err := api.NewGlideClient(config)
    if err != nil {
        log.Fatal("error connecting to database: ", err)
    }
    defer client.Close()

    tx := api.NewTransaction(client)
    cmd := tx.GlideClient

    // Queue multiple commands
    cmd.Set("user:profile", "John Doe")
    cmd.Set("user:email", "john@example.com")
    cmd.SAdd("users", "john")

    // Execute transaction
    results, err := tx.Exec()
    if err != nil {
        log.Printf("Transaction failed: %v", err)
        return
    }

    // Process results
    for _, result := range results {
        fmt.Println(result)
    }
}
```

## Cluster mode Transaction

To create a cluster transaction, initialize the cluster transaction object using `api.NewClusterTransaction(clusterClient)` to create a new cluster transaction with an established cluster client as an argument.
`cmd := tx.GlideClusterClient` grants access to a transaction-scoped cluster commands interface, allowing you to construct a sequence of operations to be executed.

```go
// Cluster Client Transaction
package main

import (
    "fmt"
    "log"
    "github.com/valkey-io/valkey-glide/go/api"
    "github.com/valkey-io/valkey-glide/go/api/options"
)

func main() {
    clusterConfig := api.NewGlideClusterClientConfiguration().
        WithAddress(&api.NodeAddress{Host: "cluster1", Port: 7007}).
        WithAddress(&api.NodeAddress{Host: "cluster2", Port: 7008}).
        WithAddress(&api.NodeAddress{Host: "cluster3", Port: 7009})

    clusterClient, err := api.NewGlideClusterClient(clusterConfig)
    if err != nil {
        log.Fatal("error connecting to cluster: ", err)
    }
    defer clusterClient.Close()

    clusterTx := api.NewClusterTransaction(clusterClient)
    cmd := clusterTx.GlideClusterClient

    // Define routing option
    var simpleRoute config.Route = config.RandomRoute

    // Create ping options with specific routing
    pingOpts := options.ClusterPingOptions{
        PingOptions: &options.PingOptions{
            Message: "Hello Valkey Cluster",
        },
        RouteOption: &options.RouteOption{
            Route: simpleRoute,
        },
    }

    // Queue commands with routing
    cmd.PingWithOptions(pingOpts)
    // Execute transaction
    results, err := clusterTx.Exec()
    if err != nil {
        log.Printf("Cluster transaction failed: %v", err)
        return
    }

    // Process results
    for _, result := range results {
        fmt.Println(result)
    }
}
```

In cluster transactions, all commands are executed on a single node, regardless of the routing configuration. The routing option does not enable multi-node transaction execution. In the below example, it routes to a random single node even when the route is not provided.

```go
clusterTx := api.NewClusterTransaction(clusterClient)
cmd := clusterTx.GlideClusterClient

// Create ping options with specific routing
pingOpts := options.ClusterPingOptions{
    PingOptions: &options.PingOptions{
        Message: "Hello Valkey Cluster",
    },
    // route is not provided here
}

// Queue commands with routing
cmd.PingWithOptions(pingOpts)
// Execute transaction
results, err := clusterTx.Exec()
if err != nil {
    log.Printf("Cluster transaction failed: %v", err)
    return
}

// Process results
for _, result := range results {
    fmt.Println(result)
}
```

## Transaction design

The transaction implementation in Valkey GLIDE was designed with several key goals, each achieved through specific implementation approaches:

### Idiomatic Go API

The design provides a natural, Go-like interface for transactions through:

- Clean command calling syntax (`cmd.Set(...)`, `cmd.Get(...)`)
- Use of Go's embedding to inherit behavior from `baseClient`
- Explicit error handling that follows Go conventions (`result, err := tx.Exec()`)

### Command Transparency

A key design followed is that commands can be used the same way in both regular and transaction contexts:

```go
// In regular client context - executes immediately
client.Set("key1", "value1")

// In transaction context - identical syntax, but queued instead
tx := NewTransaction(client)
cmd := tx.GlideClient
cmd.Set("key1", "value1")  // Queued for later execution
```

This transparency is implemented in code like this

```go
// Inside baseClient command methods like Get, Set, etc.
func (client *baseClient) Set(key string, value string) (string, error) {
    // Use the executor to send the command
    result, err := client.executor.sendCommand(C.Set, []string{key, value})
    if err != nil {
        return DefaultStringResponse, err
    }
    
    // Check if we're in a transaction
    if _, isTransaction := client.executor.(*Transaction); isTransaction && result == nil {
        return DefaultStringResponse, err
    }
    
    return handleOkResponse(result)
}
```

The key aspects:

- Regular clients and transactions both implement a common interface
- When creating a transaction, it sets itself as the command executor
- In transaction mode, commands are queued instead of executed
- The code detects transaction context and handles results appropriately
  
This enables patterns like:

```go
cmd.Watch([]string{"key1"})
// Check current value
val, _ := cmd.Get("key1")
// Only update if no one else modified since Watch
cmd.Set("key1", "new-value")
// Will fail if key1 changed between Watch and Exec
result, err := tx.Exec()
```

### Optimistic Concurrency Support

Valkey's optimistic locking mechanism is supported through:

- Implementation of `Watch()` that monitors keys for changes
- Implementation of `Unwatch()` that releases monitoring
- Proper handling of transaction failure when watched keys change
- Passing watch state through to the Valkey server during execution

This enables patterns like:

```go
cmd.Watch([]string{"key1"})
// Check current value
val, _ := cmd.Get("key1")
// Only update if no one else modified since Watch
cmd.Set("key1", "new-value")
// Will fail if key1 changed between Watch and Exec
result, err := tx.Exec()
```

### Memory Management

Memory management across language boundaries is a critical design consideration:

- Go side uses explicit pinning to prevent garbage collection of memory shared with Rust
- Reference counting in the Rust layer ensures proper cleanup
- Explicit tracking of pending requests allows graceful handling of client closure

### Discard Operation

 The `tx.Discard()` method can be used to explicitly cancel a transaction before execution.
This mechanism serves to:

- Release server-side resources associated with the transaction when the client decides not to proceed. - Clean up client-side state, such as the command queue within the `TransactionExecutor`.
- Prevent the execution of unintended commands.
 This functionality is achieved by sending the `DISCARD` command to the Valkey server, which then clears the server-side command queue for the transaction. The `tx.Discard()` method will return an error if communication with the server fails during this process.

### Composition over inheritance

The `transaction.go` defines the core transaction functionality:

```go
type Transaction struct {
    *baseClient         // Embed baseClient to inherit methods
    *GlideClient        // Embed client for command chaining
    *GlideClusterClient // Support for cluster environments
    commands []Cmder    // Queue for transaction commands
}
```

The `Transaction` struct uses composition by embedding both `baseClient` and the client types (`GlideClient` ,`GlideClusterClient`). This approach allows the transaction to inherit all methods from the client &cCommand implementations are shared between regular execution and transactions.
This composition approach allows the transaction to reuse most of the client code while overriding only the behavior that needs to change for transactions.

## Conclusion

The transaction in Valkey GLIDE go client provides a robust, idiomatic way to execute atomic operations in a Valkey database. Its design emphasizes developer experience, safety, and compatibility with Valkey semantics while providing a solid foundation for future enhancements.

## Contributors

The following contributors dedicated their efforts to implementing transactions in the Valkey GLIDE Go client:

- [Omkar Mestry](https://github.com/omangesg) (Google Cloud Platform)
- [Edric Cuartero](https://github.com/EdricCua) (Google Cloud Platform)
- [Niharika Bhavaraju](https://github.com/niharikabhavaraju) (Google Cloud Platform)
