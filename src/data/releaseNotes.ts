export interface ReleaseNote {
  version: string;
  releaseDate: string;
  sections: {
    title: string;
    items: string[];
  }[];
  sourceCodeUrl: string;
}

export interface Release {
  version: string;
  releaseDate: string;
  url: string;
}

export interface ReleaseGroup {
  majorVersion: string;
  releases: Release[];
}

export const releaseNotes: ReleaseNote = {
  "version": "8.1.0",
  "releaseDate": "Thu 11 Feb 2025",
  "sections": [
    {
      "title": "Valkey 8.1 release notes",
      "items": [
        "Hide input buffer data from being logged on protocol error when hide-user-data-from-log is enabled (#1889)",
        "Fix a bug in VM_GetCurrentUserName which leads to engine crash when no valid username provided (#1885)",
        "Optimize bitcount command by using x86 SIMD instructions (#1741)",
        "Embed hash value in hash data type entries to reduce memory footprint (#1579)",
        "Add cluster-manual-failover-timeout configuration to control the timeout for manual failover (#1690)",
        "Improve error message reporting when invalid port is provided for cluster meet command. (#1686)",
        "broadcast epoch ASAP when configEpoch changed (#1813)",
        "Add new module API flag to bypass command validation in order to reduce processing overhead (#1357)",
        "Enable TCP_NODELAY for engine initiated cluster and replication connections (#1763)",
        "Fix `ACL LOAD` crash on a connected replica node (#1842)",
        "Fix bug where no tracking-redir-broken is issued when the redirect client is in the process of getting closed. (#1823)",
        "Fix replica sometimes disconnecting when replication is using TLS. (#1737)",
        "Fix file descriptor leak when aborting dual channel replication due to error (#1721)",
        "Fix rax crash when using keys larger than 512MB (#1722)",
        "Fix RANDOMKEY command leading to infinite loop during when all CLIENT are PAUSED and all keys are with expiry (#1850)",
        "Removing unicode optimization in Lua cjson library to avoid OOM when very large strings are used. (#1785)",
        "Fix update large-reply in COMMANDLOG when reply is deferred (#1760)",
        "Avoid setting TCP/TLS specific options for UNIX Domain Socket connections (#1706)",
        "Fix a bug in the valkey-cli which would incorrectly render commands with text output in multi/exec (#1782)",
        "Check both arm64 and aarch64 for ARM based system architecture during CMake builds (#1829)",
        "Cleanup lua object files on make distclean (#1812)",
        "Fixed build error with CMake when using clang v19 (#1806)",
        "Introduce cancel argument to bgsave command (#757)",
        "Add conditional update support to the `SET` command using `IFEQ` argument (#1324)",
        "Add more filters to `CLIENT LIST` (#1401)",
        "Add `availability_zone` to the HELLO response (#1487)",
        "Extend `LATENCY LATEST` to add sum / cnt stats (#1570)",
        "Add `paused_actions` and `paused_timeout_milliseconds` for `INFO CLIENTS` (#1519)",
        "Add paused_reason to `INFO CLIENTS` (#1564)",
        "Added `COMMANDLOG` to record slow executions and large requests/replies (#1294)",
        "Fix cluster info sent stats for message with light header (#1563)",
        "Add latency stats around cluster config file operations (#1534)",
        "Add new flag in `CLIENT LIST` for import-source client (#1398)",
        "Show client capabilities in `CLIENT LIST` / `CLIENT INFO` (#1698)",
        "Introduce a new memory efficient hash table to store keys (#1186)",
        "Accelerate hash table iterator with prefetching (#1501)",
        "Accelerate hash table iterator with value prefetching (#1568)",
        "Replace dict with new hashtable: hash datatype (#1502)",
        "Replace dict with new hashtable for sets datatype (#1176)",
        "Replace dict with new hashtable: sorted set datatype (#1427)",
        "Free strings during BGSAVE/BGAOFRW to reduce copy-on-write (#905)",
        "Create an empty lua table with specified initial capacity as much as possible (#1092)",
        "Move prepareClientToWrite out of loop for HGETALL command (#1119)",
        "Improved hashing algorithm for Lua tables (#1168)",
        "Replace dict with new hashtable for sets datatype (#1176)",
        "Do security attack check only when command not found to reduce the critical path. (#1212)",
        "Trim free space from inline command argument strings to avoid excess memory usage (#1213)",
        "Increase the max number of io threads to 256. (#1220)",
        "Refactor of ActiveDefrag to reduce latencies (#1242)",
        "Integrate fast_float to optionally replace strtod (#1260)",
        "Improvements for TLS with I/O threads (#1271)",
        "Optimize PFCOUNT, PFMERGE command by SIMD acceleration (#1293)",
        "Optimize sdscatrepr by batch processing printable characters (#1342)",
        "Optimize ZRANK to avoid path comparisons (#1389)",
        "Move clientCron onto a separate timer (#1387)",
        "Client struct: lazy init components and optimize struct layout (#1405)",
        "Offload reading the replication stream to IO threads (#1449)",
        "Skip CRC checksumming during diskless full sync with TLS enabled. (#1479)",
        "Deprecate `io-threads-do-reads`, which has no effect since io threads will now always do reads. (#1138)",
        "Introduce `import-mode` config to avoid expiration and eviction during data syncing (#1185)",
        "Introduce new `rdb-version-check` config which allows for relaxed RDB version verification (#1604)",
        "Deprecate `dynamic-hz`, since server cron jobs are handled dynamically by default (#1387)",
        "Introduce `log-format` and `log-timestamp-format` to control the log format (#1022)",
        "Introducing `active-defrag-cycle-us` for more fine-grinned control of memory defragmentation run time (#1242)",
        "Introduce new configurations to control the new `COMMANDLOG` reporting thresholds (#1294)",
        "Introduce CMake build system for valkey (#1196)",
        "RDMA builtin support (#1209)",
        "Fix Valkey binary build workflow, version support changes. (#1429)",
        "Remove Valkey specific changes in jemalloc source code (#1266)",
        "Add API UpdateRuntimeArgs for updating the module arguments during runtime (#1041)",
        "Add support for MustObeyClient Module API (#1582)",
        "Adds support for scripting engines as Valkey modules (#1277, #1497)",
        "Do election in order based on failed primary rank to avoid voting conflicts (#1018)",
        "Make replica `CLUSTER RESET` flush async based on `lazyfree-lazy-user-flush` (#1190)",
        "Trigger the election as soon as possible when doing a forced manual failover (#1067)",
        "Make manual failover reset the on-going election to promote failover (#1274)",
        "Broadcast a PONG to all node in cluster when role changed (#1295)",
        "Manual failover vote is not limited by two times the node timeout (#1305)",
        "Automatic failover vote is not limited by two times the node timeout (#1356)",
        "Streams use an additional 8 bytes to track their internal size (#688)",
        "Take hz into account in activerehashing to avoid CPU spikes (#977)",
        "Incr `expired_keys` if the expiration time is already expired (#1517)",
        "Fix replica not able to initiate election in time when epoch fails (#1009)",
        "Make `FUNCTION RESTORE FLUSH` flush async based on `lazyfree-lazy-user-flush` (#1254)",
        "Allow `MEMORY MALLOC-STATS` and `MEMORY PURGE` during loading phase (#1317)",
        "Use `DEEPBIND` flag when loading external modules in order to avoid symbol conflicts (#1703)",
        "Remove the restriction that cli --cluster create requires at least 3 primary nodes (#1075)",
        "Add short client info log to CLUSTER MEET / FORGET / RESET commands (#1249)",
        "Support for reading from replicas in valkey-benchmark (#1392)",
        "valkey-cli will now re-select previously selected database after reconnect (#1694)",
        "valkey-cli will now auto-exit from subscribed mode when there are no more active subscriptions (#1432)",
        "Mark the node as FAIL when the node is marked as NOADDR and broadcast the FAIL (#1191)",
        "[Bug Fix] Optimize RDB Load Performance and Fix Cluster Mode Resizing (#1199)",
        "Log as primary role (M) instead of child process (C) during startup (#1282)",
        "Fix empty primary may have dirty slots data due to bad migration (#1285)",
        "RDMA: Fix dead loop when transfer large data (20KB) (#1386)"
      ]
    },
    {
      "title": "Assets",
      "items": [
        "Source code (zip): https://api.github.com/repos/valkey-io/valkey/zipball/8.1.0",
        "Source code (tar.gz): https://api.github.com/repos/valkey-io/valkey/tarball/8.1.0",
        "View on GitHub: https://github.com/valkey-io/valkey/tree/8.1.0"
      ]
    }
  ],
  "sourceCodeUrl": "https://github.com/valkey-io/valkey/tree/8.1.0"
};

export const previousReleases: ReleaseGroup[] = [
  {
    "majorVersion": "8.X.X",
    "releases": [
      {
        "version": "8.1.0-rc2",
        "releaseDate": "2025-03-20",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.1.0-rc2"
      },
      {
        "version": "8.1.0-rc1",
        "releaseDate": "2025-02-16",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.1.0-rc1"
      },
      {
        "version": "8.0.2",
        "releaseDate": "2025-01-07",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.0.2"
      },
      {
        "version": "8.0.1",
        "releaseDate": "2024-10-02",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.0.1"
      },
      {
        "version": "8.0.0",
        "releaseDate": "2024-09-15",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.0.0"
      },
      {
        "version": "8.0.0-rc2",
        "releaseDate": "2024-09-03",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.0.0-rc2"
      },
      {
        "version": "8.0.0-rc1",
        "releaseDate": "2024-08-01",
        "url": "https://github.com/valkey-io/valkey/releases/tag/8.0.0-rc1"
      }
    ]
  },
  {
    "majorVersion": "7.X.X",
    "releases": [
      {
        "version": "7.2.8",
        "releaseDate": "2025-01-08",
        "url": "https://github.com/valkey-io/valkey/releases/tag/7.2.8"
      },
      {
        "version": "7.2.7",
        "releaseDate": "2024-10-02",
        "url": "https://github.com/valkey-io/valkey/releases/tag/7.2.7"
      },
      {
        "version": "7.2.6",
        "releaseDate": "2024-07-31",
        "url": "https://github.com/valkey-io/valkey/releases/tag/7.2.6"
      },
      {
        "version": "7.2.5",
        "releaseDate": "2024-04-16",
        "url": "https://github.com/valkey-io/valkey/releases/tag/7.2.5"
      },
      {
        "version": "7.2.5-rc1",
        "releaseDate": "2024-04-12",
        "url": "https://github.com/valkey-io/valkey/releases/tag/7.2.5-rc1"
      },
      {
        "version": "7.2.4-rc1",
        "releaseDate": "2024-04-09",
        "url": "https://github.com/valkey-io/valkey/releases/tag/7.2.4-rc1"
      }
    ]
  }
];
