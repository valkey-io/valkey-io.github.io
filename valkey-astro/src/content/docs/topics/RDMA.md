---
title: "RDMA experimental support"
description: Valkey Over RDMA experimental support
---

Valkey supports the Remote Direct Memory Access (RDMA) connection type via a
Valkey module that can be dynamically loaded on demand.

## Getting Started

[RDMA](https://en.wikipedia.org/wiki/Remote_direct_memory_access)
enables direct data exchange between networked computers' main memory,
bypassing processors and operating systems.

As a result, RDMA offers better performance compared to TCP/IP. Test results indicate that
Valkey Over RDMA achieves approximately 2 times higher QPS and lower latency.

Please note that Valkey Over RDMA is currently supported only on Linux.
Also, before using Valkey Over RDMA, you must understand how to configure
RDMA on your server and client machines.

## Running manually

To run a Valkey server with RDMA mode:

    ./src/valkey-server --protected-mode no \
         --loadmodule src/valkey-rdma.so bind=192.168.122.100 port=6379

Bind address/port of RDMA can be modified at runtime using the following command:

    192.168.122.100:6379> CONFIG SET rdma-port 6380

Valkey can run both RDMA and TCP/IP concurrently on the same port:

    ./src/valkey-server --protected-mode no \
         --loadmodule src/valkey-rdma.so bind=192.168.122.100 port=6379 \
         --port 6379

Or append `loadmodule src/valkey-rdma.so bind=192.168.122.100 port=6379` in valkey.conf, then:

    ./src/valkey-server valkey.conf

Starting from version 9.0, `valkey-cli` and `valkey-benchmark` support the `--rdma` parameter.

    ./src/valkey-cli -h 192.168.122.100 --rdma

    ./src/valkey-benchmark -h 192.168.122.100 --rdma

### Prerequisites
Note that the network interface (192.168.122.100 of this example) should support
RDMA. To test a server supports RDMA or not:

    rdma dev show (a new version iproute2 package)
Or:

    ibv_devices (ibverbs-utils package of Debian/Ubuntu)

## Performance tuning
The RDMA completion queue will use the completion vector to signal completion events
via hardware interrupts. A large number of hardware interrupts can affect CPU performance.
It is possible to tune the performance using `rdma-comp-vector`.

See [RDMA CQ completion vector](https://man7.org/linux/man-pages/man3/ibv_create_cq.3.html)

### Example 1

- Pin hardware interrupt vectors [0, 3] to CPU [0, 3].
- Set CPU affinity for valkey to CPU [4, X].
- Any valkey server uses a random RDMA completion vector [-1].

All valkey servers will not affect each other and will be isolated from kernel interrupts.

```
  SYS    SYS    SYS    SYS  VALKEY VALKEY     VALKEY
   |      |      |      |      |      |          |
 CPU0   CPU1   CPU2   CPU3   CPU4   CPU5   ... CPUX
   |      |      |      |
 INTR0  INTR1  INTR2  INTR3
```

### Example 2

- Pin hardware interrupt vectors [0, X] to CPU [0, X].
- Set CPU affinity for valkey [M] to CPU [M].
- Valkey server [M] uses RDMA completion vector [M].

A single CPU [M] handles hardware interrupts, the RDMA completion vector [M],
and the valkey server [M] within its context only.
This avoids overhead and function calls across multiple CPUs, fully isolating
each valkey server from one another.

```
VALKEY VALKEY VALKEY VALKEY VALKEY VALKEY     VALKEY
   |      |      |      |      |      |          |
 CPU0   CPU1   CPU2   CPU3   CPU4   CPU5  ...  CPUX
   |      |      |      |      |      |          |
 INTR0  INTR1  INTR2  INTR3  INTR4  INTR5      INTRX
```

Use 0 and positive numbers to specify the RDMA completion vector, or specify -1 to allow
the server to use a random vector for a new connection. The default vector is -1.


## Protocol

The protocol defines the Queue Pairs (QP) type reliable connection (RC),
like TCP, communication commands, and payload exchange mechanism.
This dependency is based solely on the RDMA (aka Infiniband) specification
and is independent of both software (including the OS and user libraries)
and hardware (including vendors and low-level transports).

Valkey Over RDMA has control-plane (control messages) and data-plane (payload transfer).

### Control message

Control messages use fixed 32-byte big-endian message structures:
```C
typedef struct ValkeyRdmaFeature {
    /* defined as following Opcodes */
    uint16_t opcode;
    /* select features */
    uint16_t select;
    uint8_t reserved[20];
    /* feature bits */
    uint64_t features;
} ValkeyRdmaFeature;

typedef struct ValkeyRdmaKeepalive {
    /* defined as following Opcodes */
    uint16_t opcode;
    uint8_t reserved[30];
} ValkeyRdmaKeepalive;

typedef struct ValkeyRdmaMemory {
    /* defined as following Opcodes */
    uint16_t opcode;
    uint8_t reserved[14];
    /* address of a transfer buffer which is used to receive remote streaming data,
     * aka 'RX buffer address'. The remote side should use this as 'TX buffer address' */
    uint64_t addr;
    /* length of the 'RX buffer' */
    uint32_t length;
    /* the RDMA remote key of 'RX buffer' */
    uint32_t key;
} ValkeyRdmaMemory;

typedef union ValkeyRdmaCmd {
    ValkeyRdmaFeature feature;
    ValkeyRdmaKeepalive keepalive;
    ValkeyRdmaMemory memory;
} ValkeyRdmaCmd;
```

### Opcodes
|Command| Value | Description |
| :----: | :----: | :----: |
| `GetServerFeature`   | 0 | required, get the features offered by Valkey server |
| `SetClientFeature`   | 1 | required, negotiate features and set it to Valkey server |
| `Keepalive`          | 2 | required, detect unexpected orphan connection |
| `RegisterXferMemory` | 3 | required, tell the 'RX transfer buffer' information to the remote side, and the remote side uses this as 'TX transfer buffer' |

Once any new feature and command are introduced into `Valkey Over RDMA`, the client should
detect the new feature `VALKEY_RDMA_FEATURE_FOO` through the `GetServerFeature` command,
and then use the `SetClientFeature` command to enable the feature `VALKEY_RDMA_FEATURE_FOO`.
Once `VALKEY_RDMA_FEATURE_FOO` is negotiated successfully, the optional
`ValkeyRdmaFoo` command will be supported within the connection.

### RDMA Operations
- Send a control message by RDMA '**`ibv_post_send`**' with opcode '**`IBV_WR_SEND`**' with structure
  'ValkeyRdmaCmd'.
- Receive a control message by RDMA '**`ibv_post_recv`**', and the received buffer
  size should be size of 'ValkeyRdmaCmd'.
- Transfer stream data by RDMA '**`ibv_post_send`**' with opcode '**`IBV_WR_RDMA_WRITE`**' (optional) and
  '**`IBV_WR_RDMA_WRITE_WITH_IMM`**' (required), to write data segments into a connection by
  RDMA [WRITE][WRITE][WRITE]...[WRITE WITH IMM], the length of total buffer is described by
  immediate data (unsigned int 32). For example:
  a, [WRITE 128 bytes][WRITE 256 bytes][WRITE 128 bytes WITH IMM 512] writes 512 bytes to the
  remote side, the remote side is notified only once.
  b, [WRITE 128 bytes WITH IMM 128][WRITE 256 bytes WITH IMM 256][WRITE 128 bytes WITH IMM 128]
  writes 512 bytes to the remote side, the remote side is notified three times.
  Both example a and b write the same 512 bytes,
  example a has better performance, however b is easier to implement.


### Maximum WQEs of RDMA
No specific limit, 1024 recommended for WQEs.
Flow control for WQE MAY be defined/implemented in the future.


### The workflow of this protocol
```
                                                                    valkey-server
                                                                    listen RDMA port
   valkey-client
                -------------------RDMA connect-------------------->
                                                                    accept connection
                <--------------- Establish RDMA --------------------

                --------Get server feature [@IBV_WR_SEND] --------->

                --------Set client feature [@IBV_WR_SEND] --------->
                                                                    setup RX buffer
                <---- Register transfer memory [@IBV_WR_SEND] ------
[@ibv_post_recv]
setup TX buffer
                ----- Register transfer memory [@IBV_WR_SEND] ----->
                                                                    [@ibv_post_recv]
                                                                    setup TX buffer
                -- Valkey commands [@IBV_WR_RDMA_WRITE_WITH_IMM] -->
                <- Valkey response [@IBV_WR_RDMA_WRITE_WITH_IMM] ---
                                  .......
                -- Valkey commands [@IBV_WR_RDMA_WRITE_WITH_IMM] -->
                <- Valkey response [@IBV_WR_RDMA_WRITE_WITH_IMM] ---
                                  .......


RX is full
                ----- Register transfer memory [@IBV_WR_SEND] ----->
                                                                    [@ibv_post_recv]
                                                                    setup TX buffer
                <- Valkey response [@IBV_WR_RDMA_WRITE_WITH_IMM] ---
                                  .......

                                                                    RX is full
                <---- Register transfer memory [@IBV_WR_SEND] ------
[@ibv_post_recv]
setup TX buffer
                -- Valkey commands [@IBV_WR_RDMA_WRITE_WITH_IMM] -->
                <- Valkey response [@IBV_WR_RDMA_WRITE_WITH_IMM] ---
                                  .......

                -------------------RDMA disconnect----------------->
                <------------------RDMA disconnect------------------
```

The Valkey Over RDMA protocol is designed to efficiently transfer stream data and
bears similarities to several mechanisms introduced in academic papers with some differences:

* [Socksdirect: datacenter sockets can be fast and compatible](https://dl.acm.org/doi/10.1145/3341302.3342071)
* [LITE Kernel RDMA Support for Datacenter Applications](https://dl.acm.org/doi/abs/10.1145/3132747.3132762)
* [FaRM: Fast Remote Memory](https://www.usenix.org/system/files/conference/nsdi14/nsdi14-paper-dragojevic.pdf)


## How does Valkey use RDMA
Valkey supports a connection abstraction framework that hides listen/connect/accept/shutdown/read/write,
and so on. This allows the connection types to register into Valkey core during startup time.
What's more, a connection type is either Valkey built-in (Ex, TCP/IP and Unix domain socket) or
Valkey module (Ex, TLS).
Enabling RDMA support needs to link additional libraries, rather than valkey-server's additional dependence
on the shared libraries, build Valkey Over RDMA into Valkey module,
Then a user starts valkey-server with RDMA module, valkey-server loads the additional shared libraries on demand.


## Limitations
* Valkey Over RDMA is experimental, it may be changed or be removed in any minor or major version.
* TLS is not supported by Valkey Over RDMA. But it is workable in theory by a certain amount of work.
* Valkey Over RDMA is supported on Linux only.
* Not compatible with replication currently, TCP/TLS is needed for replication.
* Depending on different hardware, too many active queue pairs may lead performance drop.
