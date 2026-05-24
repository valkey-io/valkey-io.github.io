---
title: "ARM support"
description: >
    Exploring Valkey on the ARM CPU Architecture
---

Valkey supports the ARM processor, for example
the Raspberry Pi, as a main platform.
While Valkey does run on Android, in the future we look forward to extend our testing efforts to Android
to also make it an officially supported platform.

We believe that Valkey is ideal for IoT and embedded devices for several
reasons:

* Valkey has a very small memory footprint and CPU requirements. It can run in small devices like the Raspberry Pi Zero without impacting the overall performance, using a small amount of memory while delivering good performance for many use cases.
* The data structures of Valkey are often an ideal way to model IoT/embedded use cases. Some examples include accumulating time series data, receiving or queuing commands to execute or respond to send back to the remote servers, and so forth.
* Modeling data inside Valkey can be very useful in order to make in-device decisions for appliances that must respond very quickly or when the remote servers are offline.
* Valkey can be used as a communication system between the processes running in the device.
* The append-only file storage of Valkey is well suited for SSD cards.
* The stream data structure was specifically designed for time series applications and has a very low memory overhead.

## Valkey /proc/cpu/alignment requirements

Linux on ARM allows to trap unaligned accesses and fix them inside the kernel
in order to continue the execution of the offending program instead of
generating a `SIGBUS`. Valkey avoids any kind
of unaligned access, so there is no need to have a specific value for this
kernel configuration. Even when kernel alignment fixing set as disabled Valkey should
run as expected.

## Building Valkey in the Pi

* Download Valkey.
* Use `make` as usual to create the executable.

There is nothing special in the process. The only difference is that by
default, Valkey uses the `libc` allocator instead of defaulting to `jemalloc`
as it does in other Linux based environments. This is because we believe
that for the small use cases inside embedded devices, memory fragmentation
is unlikely to be a problem. Moreover `jemalloc` on ARM may not be as tested
as the `libc` allocator.

## Performance

Performance testing of Valkey was performed on the Raspberry Pi 3 and Pi 1 model B. The difference between the two Pis in terms of delivered performance is quite big. The benchmarks were performed via the
loopback interface, since most use cases will probably use Valkey from within
the device and not via the network. The following numbers were obtained using
Redis OSS 4.0.

Raspberry Pi 3:

* Test 1 : 5 millions writes with 1 million keys (even distribution among keys).  No persistence, no pipelining. 28,000 ops/sec.
* Test 2: Like test 1 but with pipelining using groups of 8 operations: 80,000 ops/sec.
* Test 3: Like test 1 but with AOF enabled, fsync 1 sec: 23,000 ops/sec
* Test 4: Like test 3, but with an AOF rewrite in progress: 21,000 ops/sec

Raspberry Pi 1 model B:

* Test 1 : 5 millions writes with 1 million keys (even distribution among keys).  No persistence, no pipelining.  2,200 ops/sec.
* Test 2: Like test 1 but with pipelining using groups of 8 operations: 8,500 ops/sec.
* Test 3: Like test 1 but with AOF enabled, fsync 1 sec: 1,820 ops/sec
* Test 4: Like test 3, but with an AOF rewrite in progress: 1,000 ops/sec

The benchmarks above are referring to simple `SET`/`GET` operations. The performance is similar for all the Valkey fast operations (not running in linear time). However sorted sets may show slightly slower numbers.
