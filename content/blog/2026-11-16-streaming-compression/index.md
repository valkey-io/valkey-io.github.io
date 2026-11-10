+++
title = "Long Story Short: Compressing Replication and Snapshots in Valkey 9.2"
date = 2026-11-16
description = "Valkey 9.2 can compress replication traffic and RDB snapshots with LZ4 or Zstandard. On a cache of 3 million JSON posts, LZ4 halved the write stream sent to a replica, and full syncs took 36% less time than with the default."
authors = ["sarthakaggarwal97"]

[taxonomies]
blog_type = ["Technical Deep Dive"]

[extra]
featured = false
featured_image = "/assets/media/featured/streaming-compression.webp"
+++

A Valkey primary sends every write it receives to each of its replicas.
When a replica runs in another availability zone or region, most cloud providers charge for every byte of that traffic.

Valkey has compressed snapshots by default for years, but never the stream of writes a replica receives after its first copy of the data.

Valkey 9.2 can use LZ4, a fast general-purpose compressor, on everything the primary sends a replica and on snapshots on disk.

## How a replica keeps up

A replica gets its data in two parts.
When it first connects, the primary sends a full sync: a snapshot of the whole dataset in RDB format.
After that, the primary streams each write to the replica as it happens.
The primary also saves snapshots in the same format to its own disk:

<picture>
<source media="(max-width: 639px), (min-width: 768px) and (max-width: 989px)" srcset="images/where-compression-applies-mobile.svg">
<img src="images/where-compression-applies.svg" alt="Snapshots on disk use snapshot compression; full syncs and the write stream to the replica use replication compression">
</picture>

## Compressing the stream instead of each value

When it writes a snapshot, Valkey by default runs a compressor called LZF over each string longer than 20 bytes.
LZF finds repeated bytes only inside the string it is compressing, so it never sees the repetition between values.
If a social app caches its posts as JSON documents, every post has the same field names, and LZF writes `"lang":"en","text":"` out in full for each one.
The same is true of sessions, user profiles, product records, or any values that share a structure.

Valkey 9.2 can instead run one LZ4 compressor over the whole snapshot or write stream.
By the time it reaches a post, it has already seen others like it, so it replaces the repeated parts with short references to the earlier bytes:

<picture>
<source media="(max-width: 639px), (min-width: 768px) and (max-width: 989px)" srcset="images/stream-back-references-mobile.svg">
<img src="images/stream-back-references.svg" alt="Repeated parts of a later post encoded as references to an earlier one">
</picture>

LZ4 can refer back up to 64 KB, which is far enough to catch field names that repeat in every value.

## Adding a replica

When a new replica connects, it needs a full sync.
Roshan Khatri [measured one](https://github.com/valkey-io/valkey/pull/4075#issuecomment-5347469711) with three million posts from a [public tweet dataset](https://huggingface.co/datasets/blockmesh/tweets), stored as JSON documents of about 315 bytes each, 1.12 GB in memory.

| Snapshot format | Bytes sent | Sync time |
|---|---:|---:|
| Uncompressed | 955 MB | 5.5 s |
| Per-value LZF (the default) | 756 MB | 8.7 s |
| Whole-stream LZ4 | 470 MB | 5.6 s |

The default was the slowest of the three: compressing each value with LZF took longer than sending everything uncompressed.
Compared with the default, LZ4 sent 38% fewer bytes and finished 36% sooner.
Compared with no compression, it sent half the bytes in about the same time.
The primary and replica were `r7g.4xlarge` instances in different availability zones, so every byte in the table crossed a zone boundary.

## Every write after that

After the full sync, the stream of writes never stops, and before Valkey 9.2 every byte of it went out uncompressed.
In Valkey 9.2, the primary keeps one compressor running per replica for the whole connection, so each write can refer back to earlier ones.
It sends whatever is ready right away, so writes never wait for a batch to fill.
Each replica's compressor reads from the primary's buffer of recent writes, the replication backlog, which stays uncompressed:

<picture>
<source media="(max-width: 639px), (min-width: 768px) and (max-width: 989px)" srcset="images/write-stream-pipeline-mobile.svg">
<img src="images/write-stream-pipeline.svg" alt="The backlog feeds one compressor per replica, and each replica decompresses what it receives">
</picture>

On the same dataset, LZ4 reduced [replication bandwidth](https://github.com/valkey-io/valkey/pull/3853) by 52%, and write throughput dropped by less than 1%.

## Snapshots on disk

Snapshots let a restart reload the data instead of starting empty, but compressing each value with LZF makes them slow to save.
On the same dataset, the files matched the full-sync sizes above (470 MB with LZ4), and took this long to save and load:

| Snapshot format | Save time | Load time |
|---|---:|---:|
| Uncompressed | 2.3 s | 7.3 s |
| Per-value LZF (the default) | 4.9 s | 9.4 s |
| Whole-stream LZ4 | 3.3 s | 6.2 s |

The LZ4 file was the fastest to load, and saved faster than the LZF file.

## Turning it on

`repl-compression` is `no` by default.
Run this on the primary, then on each replica:

```bash
> CONFIG SET repl-compression lz4
OK
```

The primary compresses only for replicas that have the setting turned on too, so replicas on older versions keep working uncompressed.
On a running server, changing the setting reconnects replicas one at a time, after any full sync in progress finishes.
Each one tries a partial sync before falling back to a full one.

On the primary, `INFO replication` appends three fields to the line for each compressed replica (`slave0:`, `slave1:`, and so on):

| Field | Meaning |
|---|---|
| `repl_compression` | The compression algorithm in use, `lz4` or `zstd` |
| `repl_compressed_bytes` | Bytes of the write stream sent over the network |
| `repl_uncompressed_bytes` | Bytes the write stream would have used without compression |

Divide `repl_compressed_bytes` by `repl_uncompressed_bytes` to see your ratio: 0.48, for example, means the replica received 48% of the original bytes.

TLS won't compress replication for you.
TLS 1.3 has no compression, and Valkey turns it off for older versions because of the [CRIME](https://en.wikipedia.org/wiki/CRIME) attack.

LZ4 is the balanced choice, halving the bytes for little CPU, so start there.
If you want fewer bytes and your machines have CPU to spare, Valkey 9.2 also supports Zstandard (`zstd`).
In a [separate test](https://github.com/valkey-io/valkey/pull/3798) with 1 million tweets, its snapshot was 36% smaller than LZ4's and loaded a little faster, but took twice as long to save, because compressing harder costs more CPU.
A full sync streams the same snapshot, so it shrinks by about the same amount.
Zstandard needs a build compiled with `BUILD_ZSTD=yes`.

Compressing snapshots on disk is a separate, optional step:

```bash
> CONFIG SET rdbcompression lz4
OK
```

Older Valkey versions and third-party RDB tools can't read these files, so before a downgrade, set `rdbcompression yes` and run `BGSAVE`, plus `BGREWRITEAOF` if you use append-only files.

## Caveats

- Each compressed replica gets its own compressor, so the CPU cost grows with the number of replicas.
With `io-threads` set above 1, that work will run on I/O threads instead of the main thread.
- Values that are already compressed or encrypted won't shrink much, and the primary still spends CPU trying.
- In Valkey 9.2, compressed full syncs don't support `forkless-policy prefer-forkless`, so they fork a child process instead.

## Try it

Turn on `repl-compression lz4` for one primary and one cross-zone replica, and after a day of real traffic, check your ratio and replication lag.
If your ratio is far from 0.48 in either direction, I would like to hear what your data looks like on [Slack](https://valkey.io/slack) or the [community page](https://valkey.io/community/).

## Acknowledgements

I added [RDB streaming compression](https://github.com/valkey-io/valkey/pull/3531), [Zstandard support](https://github.com/valkey-io/valkey/pull/3798), and [stream-compressed RDB bases in AOF files](https://github.com/valkey-io/valkey/pull/4754).
[Roshan Khatri](https://github.com/roshkhatri) extended compression to [full synchronization](https://github.com/valkey-io/valkey/pull/4075) and [steady-state replication](https://github.com/valkey-io/valkey/pull/3853), and ran the replication benchmarks.
[Viktor Söderqvist](https://github.com/zuiderkwast) [separated the storage and wire settings](https://github.com/valkey-io/valkey/pull/4749).
Thanks to everyone who reviewed these changes.
