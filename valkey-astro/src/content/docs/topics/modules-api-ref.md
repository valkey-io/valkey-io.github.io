---
title: "Modules API reference"
linkTitle: "API reference"
description: >
    Reference for the Valkey Modules API
---

<!-- This file is generated from module.c using
     utils/generate-module-api-doc.rb -->

## Sections

* [Heap allocation raw functions](#section-heap-allocation-raw-functions)
* [Commands API](#section-commands-api)
* [Module information and time measurement](#section-module-information-and-time-measurement)
* [Automatic memory management for modules](#section-automatic-memory-management-for-modules)
* [String objects APIs](#section-string-objects-apis)
* [Reply APIs](#section-reply-apis)
* [Commands replication API](#section-commands-replication-api)
* [DB and Key APIs – Generic API](#section-db-and-key-apis-generic-api)
* [Key API for String type](#section-key-api-for-string-type)
* [Key API for List type](#section-key-api-for-list-type)
* [Key API for Sorted Set type](#section-key-api-for-sorted-set-type)
* [Key API for Sorted Set iterator](#section-key-api-for-sorted-set-iterator)
* [Key API for Hash type](#section-key-api-for-hash-type)
* [Key API for Stream type](#section-key-api-for-stream-type)
* [Calling commands from modules](#section-calling-commands-from-modules)
* [Modules data types](#section-modules-data-types)
* [RDB loading and saving functions](#section-rdb-loading-and-saving-functions)
* [Key digest API (DEBUG DIGEST interface for modules types)](#section-key-digest-api-debug-digest-interface-for-modules-types)
* [AOF API for modules data types](#section-aof-api-for-modules-data-types)
* [IO context handling](#section-io-context-handling)
* [Logging](#section-logging)
* [Blocking clients from modules](#section-blocking-clients-from-modules)
* [Thread Safe Contexts](#section-thread-safe-contexts)
* [Module Keyspace Notifications API](#section-module-keyspace-notifications-api)
* [Modules Cluster API](#section-modules-cluster-api)
* [Modules Timers API](#section-modules-timers-api)
* [Modules EventLoop API](#section-modules-eventloop-api)
* [Modules ACL API](#section-modules-acl-api)
* [Modules Dictionary API](#section-modules-dictionary-api)
* [Modules Info fields](#section-modules-info-fields)
* [Modules utility APIs](#section-modules-utility-apis)
* [Modules API exporting / importing](#section-modules-api-exporting-importing)
* [Module Command Filter API](#section-module-command-filter-api)
* [Scanning keyspace and hashes](#section-scanning-keyspace-and-hashes)
* [Module fork API](#section-module-fork-api)
* [Server hooks implementation](#section-server-hooks-implementation)
* [Module Configurations API](#section-module-configurations-api)
* [RDB load/save API](#section-rdb-load-save-api)
* [Key eviction API](#section-key-eviction-api)
* [Miscellaneous APIs](#section-miscellaneous-apis)
* [Defrag API](#section-defrag-api)
* [Function index](#section-function-index)

<span id="section-heap-allocation-raw-functions"></span>

## Heap allocation raw functions

Memory allocated with these functions are taken into account by key
eviction algorithms and are reported in memory usage information.

<span id="ValkeyModule_Alloc"></span>

### `ValkeyModule_Alloc`

    void *ValkeyModule_Alloc(size_t bytes);

**Available since:** 4.0.0

Use like `malloc()`. Memory allocated with this function is reported in
INFO memory, used for keys eviction according to maxmemory settings
and in general is taken into account as memory allocated by the server.
You should avoid using `malloc()`.
This function panics if unable to allocate enough memory.

<span id="ValkeyModule_TryAlloc"></span>

### `ValkeyModule_TryAlloc`

    void *ValkeyModule_TryAlloc(size_t bytes);

**Available since:** 7.0.0

Similar to [`ValkeyModule_Alloc`](#ValkeyModule_Alloc), but returns NULL in case of allocation failure, instead
of panicking.

<span id="ValkeyModule_Calloc"></span>

### `ValkeyModule_Calloc`

    void *ValkeyModule_Calloc(size_t nmemb, size_t size);

**Available since:** 4.0.0

Use like `calloc()`. Memory allocated with this function is reported in
INFO memory, used for keys eviction according to maxmemory settings
and in general is taken into account as memory allocated by the server.
You should avoid using `calloc()` directly.

<span id="ValkeyModule_TryCalloc"></span>

### `ValkeyModule_TryCalloc`

    void *ValkeyModule_TryCalloc(size_t nmemb, size_t size);

**Available since:** 8.0.0

Similar to [`ValkeyModule_Calloc`](#ValkeyModule_Calloc), but returns NULL in case of allocation failure, instead
of panicking.

<span id="ValkeyModule_Realloc"></span>

### `ValkeyModule_Realloc`

    void *ValkeyModule_Realloc(void *ptr, size_t bytes);

**Available since:** 4.0.0

Use like `realloc()` for memory obtained with [`ValkeyModule_Alloc()`](#ValkeyModule_Alloc).

<span id="ValkeyModule_TryRealloc"></span>

### `ValkeyModule_TryRealloc`

    void *ValkeyModule_TryRealloc(void *ptr, size_t bytes);

**Available since:** 8.0.0

Similar to [`ValkeyModule_Realloc`](#ValkeyModule_Realloc), but returns NULL in case of allocation failure,
instead of panicking.

<span id="ValkeyModule_Free"></span>

### `ValkeyModule_Free`

    void ValkeyModule_Free(void *ptr);

**Available since:** 4.0.0

Use like `free()` for memory obtained by [`ValkeyModule_Alloc()`](#ValkeyModule_Alloc) and
[`ValkeyModule_Realloc()`](#ValkeyModule_Realloc). However you should never try to free with
[`ValkeyModule_Free()`](#ValkeyModule_Free) memory allocated with `malloc()` inside your module.

<span id="ValkeyModule_Strdup"></span>

### `ValkeyModule_Strdup`

    char *ValkeyModule_Strdup(const char *str);

**Available since:** 4.0.0

Like `strdup()` but returns memory allocated with [`ValkeyModule_Alloc()`](#ValkeyModule_Alloc).

<span id="ValkeyModule_PoolAlloc"></span>

### `ValkeyModule_PoolAlloc`

    void *ValkeyModule_PoolAlloc(ValkeyModuleCtx *ctx, size_t bytes);

**Available since:** 4.0.0

Return heap allocated memory that will be freed automatically when the
module callback function returns. Mostly suitable for small allocations
that are short living and must be released when the callback returns
anyway. The returned memory is aligned to the architecture word size
if at least word size bytes are requested, otherwise it is just
aligned to the next power of two, so for example a 3 bytes request is
4 bytes aligned while a 2 bytes request is 2 bytes aligned.

There is no realloc style function since when this is needed to use the
pool allocator is not a good idea.

The function returns NULL if `bytes` is 0.

<span id="section-commands-api"></span>

## Commands API

These functions are used to implement custom commands.

For examples, see [https://valkey.io/topics/modules-intro](https://valkey.io/topics/modules-intro).

<span id="ValkeyModule_IsKeysPositionRequest"></span>

### `ValkeyModule_IsKeysPositionRequest`

    int ValkeyModule_IsKeysPositionRequest(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Return non-zero if a module command, that was declared with the
flag "getkeys-api", is called in a special way to get the keys positions
and not to get executed. Otherwise zero is returned.

<span id="ValkeyModule_KeyAtPosWithFlags"></span>

### `ValkeyModule_KeyAtPosWithFlags`

    void ValkeyModule_KeyAtPosWithFlags(ValkeyModuleCtx *ctx, int pos, int flags);

**Available since:** 7.0.0

When a module command is called in order to obtain the position of
keys, since it was flagged as "getkeys-api" during the registration,
the command implementation checks for this special call using the
[`ValkeyModule_IsKeysPositionRequest()`](#ValkeyModule_IsKeysPositionRequest) API and uses this function in
order to report keys.

The supported flags are the ones used by [`ValkeyModule_SetCommandInfo`](#ValkeyModule_SetCommandInfo), see `VALKEYMODULE_CMD_KEY_`*.


The following is an example of how it could be used:

    if (ValkeyModule_IsKeysPositionRequest(ctx)) {
        ValkeyModule_KeyAtPosWithFlags(ctx, 2, VALKEYMODULE_CMD_KEY_RO | VALKEYMODULE_CMD_KEY_ACCESS);
        ValkeyModule_KeyAtPosWithFlags(ctx, 1, VALKEYMODULE_CMD_KEY_RW | VALKEYMODULE_CMD_KEY_UPDATE |
`VALKEYMODULE_CMD_KEY_ACCESS`);
    }

 Note: in the example above the get keys API could have been handled by key-specs (preferred).
 Implementing the getkeys-api is required only when is it not possible to declare key-specs that cover all keys.

<span id="ValkeyModule_KeyAtPos"></span>

### `ValkeyModule_KeyAtPos`

    void ValkeyModule_KeyAtPos(ValkeyModuleCtx *ctx, int pos);

**Available since:** 4.0.0

This API existed before [`ValkeyModule_KeyAtPosWithFlags`](#ValkeyModule_KeyAtPosWithFlags) was added, now deprecated and
can be used for compatibility with older versions, before key-specs and flags
were introduced.

<span id="ValkeyModule_IsChannelsPositionRequest"></span>

### `ValkeyModule_IsChannelsPositionRequest`

    int ValkeyModule_IsChannelsPositionRequest(ValkeyModuleCtx *ctx);

**Available since:** 7.0.0

Return non-zero if a module command, that was declared with the
flag "getchannels-api", is called in a special way to get the channel positions
and not to get executed. Otherwise zero is returned.

<span id="ValkeyModule_ChannelAtPosWithFlags"></span>

### `ValkeyModule_ChannelAtPosWithFlags`

    void ValkeyModule_ChannelAtPosWithFlags(ValkeyModuleCtx *ctx,
                                            int pos,
                                            int flags);

**Available since:** 7.0.0

When a module command is called in order to obtain the position of
channels, since it was flagged as "getchannels-api" during the
registration, the command implementation checks for this special call
using the [`ValkeyModule_IsChannelsPositionRequest()`](#ValkeyModule_IsChannelsPositionRequest) API and uses this
function in order to report the channels.

The supported flags are:
* `VALKEYMODULE_CMD_CHANNEL_SUBSCRIBE`: This command will subscribe to the channel.
* `VALKEYMODULE_CMD_CHANNEL_UNSUBSCRIBE`: This command will unsubscribe from this channel.
* `VALKEYMODULE_CMD_CHANNEL_PUBLISH`: This command will publish to this channel.
* `VALKEYMODULE_CMD_CHANNEL_PATTERN`: Instead of acting on a specific channel, will act on any
                                   channel specified by the pattern. This is the same access
                                   used by the PSUBSCRIBE and PUNSUBSCRIBE commands.
                                   Not intended to be used with PUBLISH permissions.

The following is an example of how it could be used:

    if (ValkeyModule_IsChannelsPositionRequest(ctx)) {
        ValkeyModule_ChannelAtPosWithFlags(ctx, 1, VALKEYMODULE_CMD_CHANNEL_SUBSCRIBE | VALKEYMODULE_CMD_CHANNEL_PATTERN);
        ValkeyModule_ChannelAtPosWithFlags(ctx, 1, VALKEYMODULE_CMD_CHANNEL_PUBLISH);
    }

Note: One usage of declaring channels is for evaluating ACL permissions. In this context,
unsubscribing is always allowed, so commands will only be checked against subscribe and
publish permissions. This is preferred over using [`ValkeyModule_ACLCheckChannelPermissions`](#ValkeyModule_ACLCheckChannelPermissions), since
it allows the ACLs to be checked before the command is executed.

<span id="ValkeyModule_CreateCommand"></span>

### `ValkeyModule_CreateCommand`

    int ValkeyModule_CreateCommand(ValkeyModuleCtx *ctx,
                                   const char *name,
                                   ValkeyModuleCmdFunc cmdfunc,
                                   const char *strflags,
                                   int firstkey,
                                   int lastkey,
                                   int keystep);

**Available since:** 4.0.0

Register a new command in the server, that will be handled by
calling the function pointer 'cmdfunc' using the ValkeyModule calling
convention.

The function returns `VALKEYMODULE_ERR` in these cases:
- If creation of module command is called outside the `ValkeyModule_OnLoad`.
- The specified command is already busy.
- The command name contains some chars that are not allowed.
- A set of invalid flags were passed.

Otherwise `VALKEYMODULE_OK` is returned and the new command is registered.

This function must be called during the initialization of the module
inside the `ValkeyModule_OnLoad()` function. Calling this function outside
of the initialization function is not defined.

The command function type is the following:

     int MyCommand_ValkeyCommand(ValkeyModuleCtx *ctx, ValkeyModuleString **argv, int argc);

And is supposed to always return `VALKEYMODULE_OK`.

The set of flags 'strflags' specify the behavior of the command, and should
be passed as a C string composed of space separated words, like for
example "write deny-oom". The set of flags are:

* **"write"**:     The command may modify the data set (it may also read
                   from it).
* **"readonly"**:  The command returns data from keys but never writes.
* **"admin"**:     The command is an administrative command (may change
                   replication or perform similar tasks).
* **"deny-oom"**:  The command may use additional memory and should be
                   denied during out of memory conditions.
* **"deny-script"**:   Don't allow this command in Lua scripts.
* **"allow-loading"**: Allow this command while the server is loading data.
                       Only commands not interacting with the data set
                       should be allowed to run in this mode. If not sure
                       don't use this flag.
* **"pubsub"**:    The command publishes things on Pub/Sub channels.
* **"random"**:    The command may have different outputs even starting
                   from the same input arguments and key values.
                   Starting from Redis OSS 7.0 this flag has been deprecated.
                   Declaring a command as "random" can be done using
                   command tips, see https://valkey.io/topics/command-tips.
* **"allow-stale"**: The command is allowed to run on replicas that don't
                     serve stale data. Don't use if you don't know what
                     this means.
* **"no-monitor"**: Don't propagate the command on monitor. Use this if
                    the command has sensitive data among the arguments.
* **"no-slowlog"**: Deprecated, please use "no-commandlog".
* **"no-commandlog"**: Don't log this command in the commandlog. Use this if
                    the command has sensitive data among the arguments.
* **"fast"**:      The command time complexity is not greater
                   than O(log(N)) where N is the size of the collection or
                   anything else representing the normal scalability
                   issue with the command.
* **"getkeys-api"**: The command implements the interface to return
                     the arguments that are keys. Used when start/stop/step
                     is not enough because of the command syntax.
* **"no-cluster"**: The command should not register in Cluster
                    since is not designed to work with it because, for
                    example, is unable to report the position of the
                    keys, programmatically creates key names, or any
                    other reason.
* **"no-auth"**:    This command can be run by an un-authenticated client.
                    Normally this is used by a command that is used
                    to authenticate a client.
* **"may-replicate"**: This command may generate replication traffic, even
                       though it's not a write command.
* **"no-mandatory-keys"**: All the keys this command may take are optional
* **"blocking"**: The command has the potential to block the client.
* **"allow-busy"**: Permit the command while the server is blocked either by
                    a script or by a slow module command, see
                    ValkeyModule_Yield.
* **"getchannels-api"**: The command implements the interface to return
                         the arguments that are channels.

The last three parameters specify which arguments of the new command are
keys. See [https://valkey.io/commands/command](https://valkey.io/commands/command) for more information.

* `firstkey`: One-based index of the first argument that's a key.
              Position 0 is always the command name itself.
              0 for commands with no keys.
* `lastkey`:  One-based index of the last argument that's a key.
              Negative numbers refer to counting backwards from the last
              argument (-1 means the last argument provided)
              0 for commands with no keys.
* `keystep`:  Step between first and last key indexes.
              0 for commands with no keys.

This information is used by ACL, Cluster and the `COMMAND` command.

NOTE: The scheme described above serves a limited purpose and can
only be used to find keys that exist at constant indices.
For non-trivial key arguments, you may pass 0,0,0 and use
[`ValkeyModule_SetCommandInfo`](#ValkeyModule_SetCommandInfo) to set key specs using a more advanced scheme and use
[`ValkeyModule_SetCommandACLCategories`](#ValkeyModule_SetCommandACLCategories) to set ACL categories of the commands.

<span id="ValkeyModule_GetCommand"></span>

### `ValkeyModule_GetCommand`

    ValkeyModuleCommand *ValkeyModule_GetCommand(ValkeyModuleCtx *ctx,
                                                 const char *name);

**Available since:** 7.0.0

Get an opaque structure, representing a module command, by command name.
This structure is used in some of the command-related APIs.

NULL is returned in case of the following errors:

* Command not found
* The command is not a module command
* The command doesn't belong to the calling module

<span id="ValkeyModule_CreateSubcommand"></span>

### `ValkeyModule_CreateSubcommand`

    int ValkeyModule_CreateSubcommand(ValkeyModuleCommand *parent,
                                      const char *name,
                                      ValkeyModuleCmdFunc cmdfunc,
                                      const char *strflags,
                                      int firstkey,
                                      int lastkey,
                                      int keystep);

**Available since:** 7.0.0

Very similar to [`ValkeyModule_CreateCommand`](#ValkeyModule_CreateCommand) except that it is used to create
a subcommand, associated with another, container, command.

Example: If a module has a configuration command, MODULE.CONFIG, then
GET and SET should be individual subcommands, while MODULE.CONFIG is
a command, but should not be registered with a valid `funcptr`:

     if (ValkeyModule_CreateCommand(ctx,"module.config",NULL,"",0,0,0) == VALKEYMODULE_ERR)
         return VALKEYMODULE_ERR;

     ValkeyModuleCommand *parent = ValkeyModule_GetCommand(ctx,,"module.config");

     if (ValkeyModule_CreateSubcommand(parent,"set",cmd_config_set,"",0,0,0) == VALKEYMODULE_ERR)
        return VALKEYMODULE_ERR;

     if (ValkeyModule_CreateSubcommand(parent,"get",cmd_config_get,"",0,0,0) == VALKEYMODULE_ERR)
        return VALKEYMODULE_ERR;

Returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` in case of the following errors:

* Error while parsing `strflags`
* Command is marked as `no-cluster` but cluster mode is enabled
* `parent` is already a subcommand (we do not allow more than one level of command nesting)
* `parent` is a command with an implementation (`ValkeyModuleCmdFunc`) (A parent command should be a pure container of
subcommands)
* `parent` already has a subcommand called `name`
* Creating a subcommand is called outside of `ValkeyModule_OnLoad`.

<span id="ValkeyModule_AddACLCategory"></span>

### `ValkeyModule_AddACLCategory`

    int ValkeyModule_AddACLCategory(ValkeyModuleCtx *ctx, const char *name);

**Available since:** 8.0.0

[`ValkeyModule_AddACLCategory`](#ValkeyModule_AddACLCategory) can be used to add new ACL command categories. Category names
can only contain alphanumeric characters, underscores, or dashes. Categories can only be added
during the `ValkeyModule_OnLoad` function. Once a category has been added, it can not be removed.
Any module can register a command to any added categories using [`ValkeyModule_SetCommandACLCategories`](#ValkeyModule_SetCommandACLCategories).

Returns:
- `VALKEYMODULE_OK` on successfully adding the new ACL category.
- `VALKEYMODULE_ERR` on failure.

On error the errno is set to:
- EINVAL if the name contains invalid characters.
- EBUSY if the category name already exists.
- ENOMEM if the number of categories reached the max limit of 64 categories.

<span id="ValkeyModule_SetCommandACLCategories"></span>

### `ValkeyModule_SetCommandACLCategories`

    int ValkeyModule_SetCommandACLCategories(ValkeyModuleCommand *command,
                                             const char *aclflags);

**Available since:** 7.2.0

[`ValkeyModule_SetCommandACLCategories`](#ValkeyModule_SetCommandACLCategories) can be used to set ACL categories to module
commands and subcommands. The set of ACL categories should be passed as
a space separated C string 'aclflags'.

Example, the acl flags 'write slow' marks the command as part of the write and
slow ACL categories.

On success `VALKEYMODULE_OK` is returned. On error `VALKEYMODULE_ERR` is returned.

This function can only be called during the `ValkeyModule_OnLoad` function. If called
outside of this function, an error is returned.

<span id="ValkeyModule_SetCommandInfo"></span>

### `ValkeyModule_SetCommandInfo`

    int ValkeyModule_SetCommandInfo(ValkeyModuleCommand *command,
                                    const ValkeyModuleCommandInfo *info);

**Available since:** 7.0.0

Set additional command information.

Affects the output of `COMMAND`, `COMMAND INFO` and `COMMAND DOCS`, Cluster,
ACL and is used to filter commands with the wrong number of arguments before
the call reaches the module code.

This function can be called after creating a command using [`ValkeyModule_CreateCommand`](#ValkeyModule_CreateCommand)
and fetching the command pointer using [`ValkeyModule_GetCommand`](#ValkeyModule_GetCommand). The information can
only be set once for each command and has the following structure:

    typedef struct ValkeyModuleCommandInfo {
        const ValkeyModuleCommandInfoVersion *version;
        const char *summary;
        const char *complexity;
        const char *since;
        ValkeyModuleCommandHistoryEntry *history;
        const char *tips;
        int arity;
        ValkeyModuleCommandKeySpec *key_specs;
        ValkeyModuleCommandArg *args;
    } ValkeyModuleCommandInfo;

All fields except `version` are optional. Explanation of the fields:

- `version`: This field enables compatibility with different server versions.
  Always set this field to `VALKEYMODULE_COMMAND_INFO_VERSION`.

- `summary`: A short description of the command (optional).

- `complexity`: Complexity description (optional).

- `since`: The version where the command was introduced (optional).
  Note: The version specified should be the module's, not the server version.

- `history`: An array of `ValkeyModuleCommandHistoryEntry` (optional), which is
  a struct with the following fields:

        const char *since;
        const char *changes;

    `since` is a version string and `changes` is a string describing the
    changes. The array is terminated by a zeroed entry, i.e. an entry with
    both strings set to NULL.

- `tips`: A string of space-separated tips regarding this command, meant for
  clients and proxies. See [https://valkey.io/topics/command-tips](https://valkey.io/topics/command-tips).

- `arity`: Number of arguments, including the command name itself. A positive
  number specifies an exact number of arguments and a negative number
  specifies a minimum number of arguments, so use -N to say >= N. The server
  validates a call before passing it to a module, so this can replace an
  arity check inside the module command implementation. A value of 0 (or an
  omitted arity field) is equivalent to -2 if the command has sub commands
  and -1 otherwise.

- `key_specs`: An array of `ValkeyModuleCommandKeySpec`, terminated by an
  element memset to zero. This is a scheme that tries to describe the
  positions of key arguments better than the old [`ValkeyModule_CreateCommand`](#ValkeyModule_CreateCommand) arguments
  `firstkey`, `lastkey`, `keystep` and is needed if those three are not
  enough to describe the key positions. There are two steps to retrieve key
  positions: *begin search* (BS) in which index should find the first key and
  *find keys* (FK) which, relative to the output of BS, describes how can we
  will which arguments are keys. Additionally, there are key specific flags.

    Key-specs cause the triplet (firstkey, lastkey, keystep) given in
    ValkeyModule_CreateCommand to be recomputed, but it is still useful to provide
    these three parameters in ValkeyModule_CreateCommand, to better support old server
    versions where ValkeyModule_SetCommandInfo is not available.

    Note that key-specs don't fully replace the "getkeys-api" (see
    ValkeyModule_CreateCommand, ValkeyModule_IsKeysPositionRequest and ValkeyModule_KeyAtPosWithFlags) so
    it may be a good idea to supply both key-specs and implement the
    getkeys-api.

    A key-spec has the following structure:

        typedef struct ValkeyModuleCommandKeySpec {
            const char *notes;
            uint64_t flags;
            ValkeyModuleKeySpecBeginSearchType begin_search_type;
            union {
                struct {
                    int pos;
                } index;
                struct {
                    const char *keyword;
                    int startfrom;
                } keyword;
            } bs;
            ValkeyModuleKeySpecFindKeysType find_keys_type;
            union {
                struct {
                    int lastkey;
                    int keystep;
                    int limit;
                } range;
                struct {
                    int keynumidx;
                    int firstkey;
                    int keystep;
                } keynum;
            } fk;
        } ValkeyModuleCommandKeySpec;

    Explanation of the fields of ValkeyModuleCommandKeySpec:

    * `notes`: Optional notes or clarifications about this key spec.

    * `flags`: A bitwise or of key-spec flags described below.

    * `begin_search_type`: This describes how the first key is discovered.
      There are two ways to determine the first key:

        * `VALKEYMODULE_KSPEC_BS_UNKNOWN`: There is no way to tell where the
          key args start.
        * `VALKEYMODULE_KSPEC_BS_INDEX`: Key args start at a constant index.
        * `VALKEYMODULE_KSPEC_BS_KEYWORD`: Key args start just after a
          specific keyword.

    * `bs`: This is a union in which the `index` or `keyword` branch is used
      depending on the value of the `begin_search_type` field.

        * `bs.index.pos`: The index from which we start the search for keys.
          (`VALKEYMODULE_KSPEC_BS_INDEX` only.)

        * `bs.keyword.keyword`: The keyword (string) that indicates the
          beginning of key arguments. (`VALKEYMODULE_KSPEC_BS_KEYWORD` only.)

        * `bs.keyword.startfrom`: An index in argv from which to start
          searching. Can be negative, which means start search from the end,
          in reverse. Example: -2 means to start in reverse from the
          penultimate argument. (`VALKEYMODULE_KSPEC_BS_KEYWORD` only.)

    * `find_keys_type`: After the "begin search", this describes which
      arguments are keys. The strategies are:

        * `VALKEYMODULE_KSPEC_BS_UNKNOWN`: There is no way to tell where the
          key args are located.
        * `VALKEYMODULE_KSPEC_FK_RANGE`: Keys end at a specific index (or
          relative to the last argument).
        * `VALKEYMODULE_KSPEC_FK_KEYNUM`: There's an argument that contains
          the number of key args somewhere before the keys themselves.

      `find_keys_type` and `fk` can be omitted if this keyspec describes
      exactly one key.

    * `fk`: This is a union in which the `range` or `keynum` branch is used
      depending on the value of the `find_keys_type` field.

        * `fk.range` (for `VALKEYMODULE_KSPEC_FK_RANGE`): A struct with the
          following fields:

            * `lastkey`: Index of the last key relative to the result of the
              begin search step. Can be negative, in which case it's not
              relative. -1 indicates the last argument, -2 one before the
              last and so on.

            * `keystep`: How many arguments should we skip after finding a
              key, in order to find the next one?

            * `limit`: If `lastkey` is -1, we use `limit` to stop the search
              by a factor. 0 and 1 mean no limit. 2 means 1/2 of the
              remaining args, 3 means 1/3, and so on.

        * `fk.keynum` (for `VALKEYMODULE_KSPEC_FK_KEYNUM`): A struct with the
          following fields:

            * `keynumidx`: Index of the argument containing the number of
              keys to come, relative to the result of the begin search step.

            * `firstkey`: Index of the fist key relative to the result of the
              begin search step. (Usually it's just after `keynumidx`, in
              which case it should be set to `keynumidx + 1`.)

            * `keystep`: How many arguments should we skip after finding a
              key, in order to find the next one?

    Key-spec flags:

    The first four refer to what the command actually does with the *value or
    metadata of the key*, and not necessarily the user data or how it affects
    it. Each key-spec may must have exactly one of these. Any operation
    that's not distinctly deletion, overwrite or read-only would be marked as
    RW.

    * `VALKEYMODULE_CMD_KEY_RO`: Read-Only. Reads the value of the key, but
      doesn't necessarily return it.

    * `VALKEYMODULE_CMD_KEY_RW`: Read-Write. Modifies the data stored in the
      value of the key or its metadata.

    * `VALKEYMODULE_CMD_KEY_OW`: Overwrite. Overwrites the data stored in the
      value of the key.

    * `VALKEYMODULE_CMD_KEY_RM`: Deletes the key.

    The next four refer to *user data inside the value of the key*, not the
    metadata like LRU, type, cardinality. It refers to the logical operation
    on the user's data (actual input strings or TTL), being
    used/returned/copied/changed. It doesn't refer to modification or
    returning of metadata (like type, count, presence of data). ACCESS can be
    combined with one of the write operations INSERT, DELETE or UPDATE. Any
    write that's not an INSERT or a DELETE would be UPDATE.

    * `VALKEYMODULE_CMD_KEY_ACCESS`: Returns, copies or uses the user data
      from the value of the key.

    * `VALKEYMODULE_CMD_KEY_UPDATE`: Updates data to the value, new value may
      depend on the old value.

    * `VALKEYMODULE_CMD_KEY_INSERT`: Adds data to the value with no chance of
      modification or deletion of existing data.

    * `VALKEYMODULE_CMD_KEY_DELETE`: Explicitly deletes some content from the
      value of the key.

    Other flags:

    * `VALKEYMODULE_CMD_KEY_NOT_KEY`: The key is not actually a key, but
      should be routed in cluster mode as if it was a key.

    * `VALKEYMODULE_CMD_KEY_INCOMPLETE`: The keyspec might not point out all
      the keys it should cover.

    * `VALKEYMODULE_CMD_KEY_VARIABLE_FLAGS`: Some keys might have different
      flags depending on arguments.

- `args`: An array of `ValkeyModuleCommandArg`, terminated by an element memset
  to zero. `ValkeyModuleCommandArg` is a structure with at the fields described
  below.

        typedef struct ValkeyModuleCommandArg {
            const char *name;
            ValkeyModuleCommandArgType type;
            int key_spec_index;
            const char *token;
            const char *summary;
            const char *since;
            int flags;
            struct ValkeyModuleCommandArg *subargs;
        } ValkeyModuleCommandArg;

    Explanation of the fields:

    * `name`: Name of the argument.

    * `type`: The type of the argument. See below for details. The types
      `VALKEYMODULE_ARG_TYPE_ONEOF` and `VALKEYMODULE_ARG_TYPE_BLOCK` require
      an argument to have sub-arguments, i.e. `subargs`.

    * `key_spec_index`: If the `type` is `VALKEYMODULE_ARG_TYPE_KEY` you must
      provide the index of the key-spec associated with this argument. See
      `key_specs` above. If the argument is not a key, you may specify -1.

    * `token`: The token preceding the argument (optional). Example: the
      argument `seconds` in `SET` has a token `EX`. If the argument consists
      of only a token (for example `NX` in `SET`) the type should be
      `VALKEYMODULE_ARG_TYPE_PURE_TOKEN` and `value` should be NULL.

    * `summary`: A short description of the argument (optional).

    * `since`: The first version which included this argument (optional).

    * `flags`: A bitwise or of the macros `VALKEYMODULE_CMD_ARG_*`. See below.

    * `value`: The display-value of the argument. This string is what should
      be displayed when creating the command syntax from the output of
      `COMMAND`. If `token` is not NULL, it should also be displayed.

    Explanation of `ValkeyModuleCommandArgType`:

    * `VALKEYMODULE_ARG_TYPE_STRING`: String argument.
    * `VALKEYMODULE_ARG_TYPE_INTEGER`: Integer argument.
    * `VALKEYMODULE_ARG_TYPE_DOUBLE`: Double-precision float argument.
    * `VALKEYMODULE_ARG_TYPE_KEY`: String argument representing a keyname.
    * `VALKEYMODULE_ARG_TYPE_PATTERN`: String, but regex pattern.
    * `VALKEYMODULE_ARG_TYPE_UNIX_TIME`: Integer, but Unix timestamp.
    * `VALKEYMODULE_ARG_TYPE_PURE_TOKEN`: Argument doesn't have a placeholder.
      It's just a token without a value. Example: the `KEEPTTL` option of the
      `SET` command.
    * `VALKEYMODULE_ARG_TYPE_ONEOF`: Used when the user can choose only one of
      a few sub-arguments. Requires `subargs`. Example: the `NX` and `XX`
      options of `SET`.
    * `VALKEYMODULE_ARG_TYPE_BLOCK`: Used when one wants to group together
      several sub-arguments, usually to apply something on all of them, like
      making the entire group "optional". Requires `subargs`. Example: the
      `LIMIT offset count` parameters in `ZRANGE`.

    Explanation of the command argument flags:

    * `VALKEYMODULE_CMD_ARG_OPTIONAL`: The argument is optional (like GET in
      the SET command).
    * `VALKEYMODULE_CMD_ARG_MULTIPLE`: The argument may repeat itself (like
      key in DEL).
    * `VALKEYMODULE_CMD_ARG_MULTIPLE_TOKEN`: The argument may repeat itself,
      and so does its token (like `GET pattern` in SORT).

On success `VALKEYMODULE_OK` is returned. On error `VALKEYMODULE_ERR` is returned
and `errno` is set to EINVAL if invalid info was provided or EEXIST if info
has already been set. If the info is invalid, a warning is logged explaining
which part of the info is invalid and why.

<span id="ValkeyModule_UpdateRuntimeArgs"></span>

### `ValkeyModule_UpdateRuntimeArgs`

    int ValkeyModule_UpdateRuntimeArgs(ValkeyModuleCtx *ctx,
                                       ValkeyModuleString **argv,
                                       int argc);

**Available since:** 8.1.0

[`ValkeyModule_UpdateRuntimeArgs`](#ValkeyModule_UpdateRuntimeArgs) can be used to update the module argument values.
The function parameter 'argc' indicates the number of updated arguments, and 'argv'
represents the values of the updated arguments.
Once 'CONFIG REWRITE' command is called, the updated argument values can be saved into conf file.

The function always returns `VALKEYMODULE_OK`.

<span id="section-module-information-and-time-measurement"></span>

## Module information and time measurement

<span id="ValkeyModule_IsModuleNameBusy"></span>

### `ValkeyModule_IsModuleNameBusy`

    int ValkeyModule_IsModuleNameBusy(const char *name);

**Available since:** 4.0.3

Return non-zero if the module name is busy.
Otherwise zero is returned.

<span id="ValkeyModule_Milliseconds"></span>

### `ValkeyModule_Milliseconds`

    mstime_t ValkeyModule_Milliseconds(void);

**Available since:** 4.0.0

Return the current UNIX time in milliseconds.

<span id="ValkeyModule_MonotonicMicroseconds"></span>

### `ValkeyModule_MonotonicMicroseconds`

    uint64_t ValkeyModule_MonotonicMicroseconds(void);

**Available since:** 7.0.0

Return counter of micro-seconds relative to an arbitrary point in time.

<span id="ValkeyModule_Microseconds"></span>

### `ValkeyModule_Microseconds`

    ustime_t ValkeyModule_Microseconds(void);

**Available since:** 7.2.0

Return the current UNIX time in microseconds

<span id="ValkeyModule_CachedMicroseconds"></span>

### `ValkeyModule_CachedMicroseconds`

    ustime_t ValkeyModule_CachedMicroseconds(void);

**Available since:** 7.2.0

Return the cached UNIX time in microseconds.
It is updated in the server cron job and before executing a command.
It is useful for complex call stacks, such as a command causing a
key space notification, causing a module to execute a [`ValkeyModule_Call`](#ValkeyModule_Call),
causing another notification, etc.
It makes sense that all this callbacks would use the same clock.

<span id="ValkeyModule_BlockedClientMeasureTimeStart"></span>

### `ValkeyModule_BlockedClientMeasureTimeStart`

    int ValkeyModule_BlockedClientMeasureTimeStart(ValkeyModuleBlockedClient *bc);

**Available since:** 6.2.0

Mark a point in time that will be used as the start time to calculate
the elapsed execution time when [`ValkeyModule_BlockedClientMeasureTimeEnd()`](#ValkeyModule_BlockedClientMeasureTimeEnd) is called.
Within the same command, you can call multiple times
[`ValkeyModule_BlockedClientMeasureTimeStart()`](#ValkeyModule_BlockedClientMeasureTimeStart) and [`ValkeyModule_BlockedClientMeasureTimeEnd()`](#ValkeyModule_BlockedClientMeasureTimeEnd)
to accumulate independent time intervals to the background duration.
This method always return `VALKEYMODULE_OK`.

This function is not thread safe, If used in module thread and blocked callback (possibly main thread)
simultaneously, it's recommended to protect them with lock owned by caller instead of GIL.

<span id="ValkeyModule_BlockedClientMeasureTimeEnd"></span>

### `ValkeyModule_BlockedClientMeasureTimeEnd`

    int ValkeyModule_BlockedClientMeasureTimeEnd(ValkeyModuleBlockedClient *bc);

**Available since:** 6.2.0

Mark a point in time that will be used as the end time
to calculate the elapsed execution time.
On success `VALKEYMODULE_OK` is returned.
This method only returns `VALKEYMODULE_ERR` if no start time was
previously defined ( meaning [`ValkeyModule_BlockedClientMeasureTimeStart`](#ValkeyModule_BlockedClientMeasureTimeStart) was not called ).

This function is not thread safe, If used in module thread and blocked callback (possibly main thread)
simultaneously, it's recommended to protect them with lock owned by caller instead of GIL.

<span id="ValkeyModule_Yield"></span>

### `ValkeyModule_Yield`

    void ValkeyModule_Yield(ValkeyModuleCtx *ctx,
                            int flags,
                            const char *busy_reply);

**Available since:** 7.0.0

This API allows modules to let the server process background tasks, and some
commands during long blocking execution of a module command.
The module can call this API periodically.
The flags is a bit mask of these:

- `VALKEYMODULE_YIELD_FLAG_NONE`: No special flags, can perform some background
                                 operations, but not process client commands.
- `VALKEYMODULE_YIELD_FLAG_CLIENTS`: The server can also process client commands.

The `busy_reply` argument is optional, and can be used to control the verbose
error string after the `-BUSY` error code.

When the `VALKEYMODULE_YIELD_FLAG_CLIENTS` is used, the server will only start
processing client commands after the time defined by the
`busy-reply-threshold` config, in which case the server will start rejecting most
commands with `-BUSY` error, but allow the ones marked with the `allow-busy`
flag to be executed.
This API can also be used in thread safe context (while locked), and during
loading (in the `rdb_load` callback, in which case it'll reject commands with
the -LOADING error)

<span id="ValkeyModule_SetModuleOptions"></span>

### `ValkeyModule_SetModuleOptions`

    void ValkeyModule_SetModuleOptions(ValkeyModuleCtx *ctx, int options);

**Available since:** 6.0.0

Set flags defining capabilities or behavior bit flags.

`VALKEYMODULE_OPTIONS_HANDLE_IO_ERRORS`:
Generally, modules don't need to bother with this, as the process will just
terminate if a read error happens, however, setting this flag would allow
repl-diskless-load to work if enabled.
The module should use [`ValkeyModule_IsIOError`](#ValkeyModule_IsIOError) after reads, before using the
data that was read, and in case of error, propagate it upwards, and also be
able to release the partially populated value and all it's allocations.

`VALKEYMODULE_OPTION_NO_IMPLICIT_SIGNAL_MODIFIED`:
See [`ValkeyModule_SignalModifiedKey()`](#ValkeyModule_SignalModifiedKey).

`VALKEYMODULE_OPTIONS_HANDLE_REPL_ASYNC_LOAD`:
Setting this flag indicates module awareness of diskless async replication (repl-diskless-load=swapdb)
and that the server could be serving reads during replication instead of blocking with LOADING status.

`VALKEYMODULE_OPTIONS_ALLOW_NESTED_KEYSPACE_NOTIFICATIONS`:
Declare that the module wants to get nested key-space notifications.
By default, the server will not fire key-space notifications that happened inside
a key-space notification callback. This flag allows to change this behavior
and fire nested key-space notifications. Notice: if enabled, the module
should protected itself from infinite recursion.

`VALKEYMODULE_OPTIONS_SKIP_COMMAND_VALIDATION`:
When set, this option allows the module to skip command validation.
This is useful in scenarios where the module needs to bypass
command validation for specific operations
to reduce overhead or handle trusted custom command logic.
[`ValkeyModule_Replicate`](#ValkeyModule_Replicate) and [`ValkeyModule_EmitAOF`](#ValkeyModule_EmitAOF)
are affected by this option, allowing them to operate without
command validation check.

`VALKEYMODULE_OPTIONS_HANDLE_ATOMIC_SLOT_MIGRATION`:
When set, this option indicates that the module is capable of handling
atomic slot migration. If not set, the module is assumed to not be aware of
atomic slot migration and CLUSTER MIGRATESLOTS will return an error. Modules
should set this flag if they understand keys may be loaded during the
migration but before ownership is transferred.

<span id="ValkeyModule_SignalModifiedKey"></span>

### `ValkeyModule_SignalModifiedKey`

    int ValkeyModule_SignalModifiedKey(ValkeyModuleCtx *ctx,
                                       ValkeyModuleString *keyname);

**Available since:** 6.0.0

Signals that the key is modified from user's perspective (i.e. invalidate WATCH
and client side caching).

This is done automatically when a key opened for writing is closed, unless
the option `VALKEYMODULE_OPTION_NO_IMPLICIT_SIGNAL_MODIFIED` has been set using
[`ValkeyModule_SetModuleOptions()`](#ValkeyModule_SetModuleOptions).

<span id="section-automatic-memory-management-for-modules"></span>

## Automatic memory management for modules

<span id="ValkeyModule_AutoMemory"></span>

### `ValkeyModule_AutoMemory`

    void ValkeyModule_AutoMemory(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Enable automatic memory management.

The function must be called as the first function of a command implementation
that wants to use automatic memory.

When enabled, automatic memory management tracks and automatically frees
keys, call replies and `ValkeyModuleString` objects once the command returns. In most
cases this eliminates the need of calling the following functions:

1. [`ValkeyModule_CloseKey()`](#ValkeyModule_CloseKey)
2. [`ValkeyModule_FreeCallReply()`](#ValkeyModule_FreeCallReply)
3. [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString)

These functions can still be used with automatic memory management enabled,
to optimize loops that make numerous allocations for example.

<span id="section-string-objects-apis"></span>

## String objects APIs

<span id="ValkeyModule_CreateString"></span>

### `ValkeyModule_CreateString`

    ValkeyModuleString *ValkeyModule_CreateString(ValkeyModuleCtx *ctx,
                                                  const char *ptr,
                                                  size_t len);

**Available since:** 4.0.0

Create a new module string object. The returned string must be freed
with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString), unless automatic memory is enabled.

The string is created by copying the `len` bytes starting
at `ptr`. No reference is retained to the passed buffer.

The module context 'ctx' is optional and may be NULL if you want to create
a string out of the context scope. However in that case, the automatic
memory management will not be available, and the string memory must be
managed manually.

<span id="ValkeyModule_CreateStringPrintf"></span>

### `ValkeyModule_CreateStringPrintf`

    ValkeyModuleString *ValkeyModule_CreateStringPrintf(ValkeyModuleCtx *ctx,
                                                        const char *fmt,
                                                        ...);

**Available since:** 4.0.0

Create a new module string object from a printf format and arguments.
The returned string must be freed with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString), unless
automatic memory is enabled.

The string is created using the sds formatter function `sdscatvprintf()`.

The passed context 'ctx' may be NULL if necessary, see the
[`ValkeyModule_CreateString()`](#ValkeyModule_CreateString) documentation for more info.

<span id="ValkeyModule_CreateStringFromLongLong"></span>

### `ValkeyModule_CreateStringFromLongLong`

    ValkeyModuleString *ValkeyModule_CreateStringFromLongLong(ValkeyModuleCtx *ctx,
                                                              long long ll);

**Available since:** 4.0.0

Like [`ValkeyModule_CreateString()`](#ValkeyModule_CreateString), but creates a string starting from a `long long`
integer instead of taking a buffer and its length.

The returned string must be released with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by
enabling automatic memory management.

The passed context 'ctx' may be NULL if necessary, see the
[`ValkeyModule_CreateString()`](#ValkeyModule_CreateString) documentation for more info.

<span id="ValkeyModule_CreateStringFromULongLong"></span>

### `ValkeyModule_CreateStringFromULongLong`

    ValkeyModuleString *ValkeyModule_CreateStringFromULongLong(ValkeyModuleCtx *ctx,
                                                               unsigned long long ull);

**Available since:** 7.0.3

Like [`ValkeyModule_CreateString()`](#ValkeyModule_CreateString), but creates a string starting from a `unsigned long long`
integer instead of taking a buffer and its length.

The returned string must be released with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by
enabling automatic memory management.

The passed context 'ctx' may be NULL if necessary, see the
[`ValkeyModule_CreateString()`](#ValkeyModule_CreateString) documentation for more info.

<span id="ValkeyModule_CreateStringFromDouble"></span>

### `ValkeyModule_CreateStringFromDouble`

    ValkeyModuleString *ValkeyModule_CreateStringFromDouble(ValkeyModuleCtx *ctx,
                                                            double d);

**Available since:** 6.0.0

Like [`ValkeyModule_CreateString()`](#ValkeyModule_CreateString), but creates a string starting from a double
instead of taking a buffer and its length.

The returned string must be released with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by
enabling automatic memory management.

<span id="ValkeyModule_CreateStringFromLongDouble"></span>

### `ValkeyModule_CreateStringFromLongDouble`

    ValkeyModuleString *ValkeyModule_CreateStringFromLongDouble(ValkeyModuleCtx *ctx,
                                                                long double ld,
                                                                int humanfriendly);

**Available since:** 6.0.0

Like [`ValkeyModule_CreateString()`](#ValkeyModule_CreateString), but creates a string starting from a long
double.

The returned string must be released with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by
enabling automatic memory management.

The passed context 'ctx' may be NULL if necessary, see the
[`ValkeyModule_CreateString()`](#ValkeyModule_CreateString) documentation for more info.

<span id="ValkeyModule_CreateStringFromString"></span>

### `ValkeyModule_CreateStringFromString`

    ValkeyModuleString *ValkeyModule_CreateStringFromString(ValkeyModuleCtx *ctx,
                                                            const ValkeyModuleString *str);

**Available since:** 4.0.0

Like [`ValkeyModule_CreateString()`](#ValkeyModule_CreateString), but creates a string starting from another
`ValkeyModuleString`.

The returned string must be released with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by
enabling automatic memory management.

The passed context 'ctx' may be NULL if necessary, see the
[`ValkeyModule_CreateString()`](#ValkeyModule_CreateString) documentation for more info.

<span id="ValkeyModule_CreateStringFromStreamID"></span>

### `ValkeyModule_CreateStringFromStreamID`

    ValkeyModuleString *ValkeyModule_CreateStringFromStreamID(ValkeyModuleCtx *ctx,
                                                              const ValkeyModuleStreamID *id);

**Available since:** 6.2.0

Creates a string from a stream ID. The returned string must be released with
[`ValkeyModule_FreeString()`](#ValkeyModule_FreeString), unless automatic memory is enabled.

The passed context `ctx` may be NULL if necessary. See the
[`ValkeyModule_CreateString()`](#ValkeyModule_CreateString) documentation for more info.

<span id="ValkeyModule_FreeString"></span>

### `ValkeyModule_FreeString`

    void ValkeyModule_FreeString(ValkeyModuleCtx *ctx, ValkeyModuleString *str);

**Available since:** 4.0.0

Free a module string object obtained with one of the module API calls
that return new string objects.

It is possible to call this function even when automatic memory management
is enabled. In that case the string will be released ASAP and removed
from the pool of string to release at the end.

If the string was created with a NULL context 'ctx', it is also possible to
pass ctx as NULL when releasing the string (but passing a context will not
create any issue). Strings created with a context should be freed also passing
the context, so if you want to free a string out of context later, make sure
to create it using a NULL context.

This API is not thread safe, access to these retained strings (if they originated
from a client command arguments) must be done with GIL locked.

<span id="ValkeyModule_RetainString"></span>

### `ValkeyModule_RetainString`

    void ValkeyModule_RetainString(ValkeyModuleCtx *ctx, ValkeyModuleString *str);

**Available since:** 4.0.0

Every call to this function, will make the string 'str' requiring
an additional call to [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) in order to really
free the string. Note that the automatic freeing of the string obtained
enabling modules automatic memory management counts for one
[`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) call (it is just executed automatically).

Normally you want to call this function when, at the same time
the following conditions are true:

1. You have automatic memory management enabled.
2. You want to create string objects.
3. Those string objects you create need to live *after* the callback
   function(for example a command implementation) creating them returns.

Usually you want this in order to store the created string object
into your own data structure, for example when implementing a new data
type.

Note that when memory management is turned off, you don't need
any call to RetainString() since creating a string will always result
into a string that lives after the callback function returns, if
no FreeString() call is performed.

It is possible to call this function with a NULL context.

When strings are going to be retained for an extended duration, it is good
practice to also call [`ValkeyModule_TrimStringAllocation()`](#ValkeyModule_TrimStringAllocation) in order to
optimize memory usage.

Threaded modules that reference retained strings from other threads *must*
explicitly trim the allocation as soon as the string is retained. Not doing
so may result with automatic trimming which is not thread safe.

This API is not thread safe, access to these retained strings (if they originated
from a client command arguments) must be done with GIL locked.

<span id="ValkeyModule_HoldString"></span>

### `ValkeyModule_HoldString`

    ValkeyModuleString *ValkeyModule_HoldString(ValkeyModuleCtx *ctx,
                                                ValkeyModuleString *str);

**Available since:** 6.0.7


This function can be used instead of [`ValkeyModule_RetainString()`](#ValkeyModule_RetainString).
The main difference between the two is that this function will always
succeed, whereas [`ValkeyModule_RetainString()`](#ValkeyModule_RetainString) may fail because of an
assertion.

The function returns a pointer to `ValkeyModuleString`, which is owned
by the caller. It requires a call to [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) to free
the string when automatic memory management is disabled for the context.
When automatic memory management is enabled, you can either call
[`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or let the automation free it.

This function is more efficient than [`ValkeyModule_CreateStringFromString()`](#ValkeyModule_CreateStringFromString)
because whenever possible, it avoids copying the underlying
`ValkeyModuleString`. The disadvantage of using this function is that it
might not be possible to use [`ValkeyModule_StringAppendBuffer()`](#ValkeyModule_StringAppendBuffer) on the
returned `ValkeyModuleString`.

It is possible to call this function with a NULL context.

When strings are going to be held for an extended duration, it is good
practice to also call [`ValkeyModule_TrimStringAllocation()`](#ValkeyModule_TrimStringAllocation) in order to
optimize memory usage.

Threaded modules that reference held strings from other threads *must*
explicitly trim the allocation as soon as the string is held. Not doing
so may result with automatic trimming which is not thread safe.

This API is not thread safe, access to these retained strings (if they originated
from a client command arguments) must be done with GIL locked.

<span id="ValkeyModule_StringPtrLen"></span>

### `ValkeyModule_StringPtrLen`

    const char *ValkeyModule_StringPtrLen(const ValkeyModuleString *str,
                                          size_t *len);

**Available since:** 4.0.0

Given a string module object, this function returns the string pointer
and length of the string. The returned pointer and length should only
be used for read only accesses and never modified.

<span id="ValkeyModule_StringToLongLong"></span>

### `ValkeyModule_StringToLongLong`

    int ValkeyModule_StringToLongLong(const ValkeyModuleString *str, long long *ll);

**Available since:** 4.0.0

Convert the string into a `long long` integer, storing it at `*ll`.
Returns `VALKEYMODULE_OK` on success. If the string can't be parsed
as a valid, strict `long long` (no spaces before/after), `VALKEYMODULE_ERR`
is returned.

<span id="ValkeyModule_StringToULongLong"></span>

### `ValkeyModule_StringToULongLong`

    int ValkeyModule_StringToULongLong(const ValkeyModuleString *str,
                                       unsigned long long *ull);

**Available since:** 7.0.3

Convert the string into a `unsigned long long` integer, storing it at `*ull`.
Returns `VALKEYMODULE_OK` on success. If the string can't be parsed
as a valid, strict `unsigned long long` (no spaces before/after), `VALKEYMODULE_ERR`
is returned.

<span id="ValkeyModule_StringToDouble"></span>

### `ValkeyModule_StringToDouble`

    int ValkeyModule_StringToDouble(const ValkeyModuleString *str, double *d);

**Available since:** 4.0.0

Convert the string into a double, storing it at `*d`.
Returns `VALKEYMODULE_OK` on success or `VALKEYMODULE_ERR` if the string is
not a valid string representation of a double value.

<span id="ValkeyModule_StringToLongDouble"></span>

### `ValkeyModule_StringToLongDouble`

    int ValkeyModule_StringToLongDouble(const ValkeyModuleString *str,
                                        long double *ld);

**Available since:** 6.0.0

Convert the string into a long double, storing it at `*ld`.
Returns `VALKEYMODULE_OK` on success or `VALKEYMODULE_ERR` if the string is
not a valid string representation of a double value.

<span id="ValkeyModule_StringToStreamID"></span>

### `ValkeyModule_StringToStreamID`

    int ValkeyModule_StringToStreamID(const ValkeyModuleString *str,
                                      ValkeyModuleStreamID *id);

**Available since:** 6.2.0

Convert the string into a stream ID, storing it at `*id`.
Returns `VALKEYMODULE_OK` on success and returns `VALKEYMODULE_ERR` if the string
is not a valid string representation of a stream ID. The special IDs "+" and
"-" are allowed.

<span id="ValkeyModule_StringCompare"></span>

### `ValkeyModule_StringCompare`

    int ValkeyModule_StringCompare(const ValkeyModuleString *a,
                                   const ValkeyModuleString *b);

**Available since:** 4.0.0

Compare two string objects, returning -1, 0 or 1 respectively if
a < b, a == b, a > b. Strings are compared byte by byte as two
binary blobs without any encoding care / collation attempt.

<span id="ValkeyModule_StringAppendBuffer"></span>

### `ValkeyModule_StringAppendBuffer`

    int ValkeyModule_StringAppendBuffer(ValkeyModuleCtx *ctx,
                                        ValkeyModuleString *str,
                                        const char *buf,
                                        size_t len);

**Available since:** 4.0.0

Append the specified buffer to the string 'str'. The string must be a
string created by the user that is referenced only a single time, otherwise
`VALKEYMODULE_ERR` is returned and the operation is not performed.

<span id="ValkeyModule_TrimStringAllocation"></span>

### `ValkeyModule_TrimStringAllocation`

    void ValkeyModule_TrimStringAllocation(ValkeyModuleString *str);

**Available since:** 7.0.0

Trim possible excess memory allocated for a `ValkeyModuleString`.

Sometimes a `ValkeyModuleString` may have more memory allocated for
it than required, typically for argv arguments that were constructed
from network buffers. This function optimizes such strings by reallocating
their memory, which is useful for strings that are not short lived but
retained for an extended duration.

This operation is *not thread safe* and should only be called when
no concurrent access to the string is guaranteed. Using it for an argv
string in a module command before the string is potentially available
to other threads is generally safe.

Currently, the server may also automatically trim retained strings when a
module command returns. However, doing this explicitly should still be
a preferred option:

1. Future versions of the server may abandon auto-trimming.
2. Auto-trimming as currently implemented is *not thread safe*.
   A background thread manipulating a recently retained string may end up
   in a race condition with the auto-trim, which could result with
   data corruption.

<span id="section-reply-apis"></span>

## Reply APIs

These functions are used for sending replies to the client.

Most functions always return `VALKEYMODULE_OK` so you can use it with
'return' in order to return from the command implementation with:

    if (... some condition ...)
        return ValkeyModule_ReplyWithLongLong(ctx,mycount);

### Reply with collection functions

After starting a collection reply, the module must make calls to other
`ReplyWith*` style functions in order to emit the elements of the collection.
Collection types include: Array, Map, Set and Attribute.

When producing collections with a number of elements that is not known
beforehand, the function can be called with a special flag
`VALKEYMODULE_POSTPONED_LEN` (`VALKEYMODULE_POSTPONED_ARRAY_LEN` in the past),
and the actual number of elements can be later set with `ValkeyModule_ReplySet`*Length()
call (which will set the latest "open" count if there are multiple ones).

<span id="ValkeyModule_WrongArity"></span>

### `ValkeyModule_WrongArity`

    int ValkeyModule_WrongArity(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Send an error about the number of arguments given to the command,
citing the command name in the error message. Returns `VALKEYMODULE_OK`.

Example:

    if (argc != 3) return ValkeyModule_WrongArity(ctx);

<span id="ValkeyModule_ReplyWithLongLong"></span>

### `ValkeyModule_ReplyWithLongLong`

    int ValkeyModule_ReplyWithLongLong(ValkeyModuleCtx *ctx, long long ll);

**Available since:** 4.0.0

Send an integer reply to the client, with the specified `long long` value.
The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithError"></span>

### `ValkeyModule_ReplyWithError`

    int ValkeyModule_ReplyWithError(ValkeyModuleCtx *ctx, const char *err);

**Available since:** 4.0.0

Reply with the error 'err'.

Note that 'err' must contain all the error, including
the initial error code. The function only provides the initial "-", so
the usage is, for example:

    ValkeyModule_ReplyWithError(ctx,"ERR Wrong Type");

and not just:

    ValkeyModule_ReplyWithError(ctx,"Wrong Type");

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithErrorFormat"></span>

### `ValkeyModule_ReplyWithErrorFormat`

    int ValkeyModule_ReplyWithErrorFormat(ValkeyModuleCtx *ctx,
                                          const char *fmt,
                                          ...);

**Available since:** 7.2.0

Reply with the error create from a printf format and arguments.

Note that 'fmt' must contain all the error, including
the initial error code. The function only provides the initial "-", so
the usage is, for example:

    ValkeyModule_ReplyWithErrorFormat(ctx,"ERR Wrong Type: %s",type);

and not just:

    ValkeyModule_ReplyWithErrorFormat(ctx,"Wrong Type: %s",type);

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithSimpleString"></span>

### `ValkeyModule_ReplyWithSimpleString`

    int ValkeyModule_ReplyWithSimpleString(ValkeyModuleCtx *ctx, const char *msg);

**Available since:** 4.0.0

Reply with a simple string (`+... \r\n` in RESP protocol). This replies
are suitable only when sending a small non-binary string with small
overhead, like "OK" or similar replies.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithArray"></span>

### `ValkeyModule_ReplyWithArray`

    int ValkeyModule_ReplyWithArray(ValkeyModuleCtx *ctx, long len);

**Available since:** 4.0.0

Reply with an array type of 'len' elements.

After starting an array reply, the module must make `len` calls to other
`ReplyWith*` style functions in order to emit the elements of the array.
See Reply APIs section for more details.

Use [`ValkeyModule_ReplySetArrayLength()`](#ValkeyModule_ReplySetArrayLength) to set deferred length.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithMap"></span>

### `ValkeyModule_ReplyWithMap`

    int ValkeyModule_ReplyWithMap(ValkeyModuleCtx *ctx, long len);

**Available since:** 7.0.0

Reply with a RESP3 Map type of 'len' pairs.
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

After starting a map reply, the module must make `len*2` calls to other
`ReplyWith*` style functions in order to emit the elements of the map.
See Reply APIs section for more details.

If the connected client is using RESP2, the reply will be converted to a flat
array.

Use [`ValkeyModule_ReplySetMapLength()`](#ValkeyModule_ReplySetMapLength) to set deferred length.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithSet"></span>

### `ValkeyModule_ReplyWithSet`

    int ValkeyModule_ReplyWithSet(ValkeyModuleCtx *ctx, long len);

**Available since:** 7.0.0

Reply with a RESP3 Set type of 'len' elements.
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

After starting a set reply, the module must make `len` calls to other
`ReplyWith*` style functions in order to emit the elements of the set.
See Reply APIs section for more details.

If the connected client is using RESP2, the reply will be converted to an
array type.

Use [`ValkeyModule_ReplySetSetLength()`](#ValkeyModule_ReplySetSetLength) to set deferred length.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithAttribute"></span>

### `ValkeyModule_ReplyWithAttribute`

    int ValkeyModule_ReplyWithAttribute(ValkeyModuleCtx *ctx, long len);

**Available since:** 7.0.0

Add attributes (metadata) to the reply. Should be done before adding the
actual reply. see [https://valkey.io/topics/protocol#attribute-type](https://valkey.io/topics/protocol#attribute-type)

After starting an attribute's reply, the module must make `len*2` calls to other
`ReplyWith*` style functions in order to emit the elements of the attribute map.
See Reply APIs section for more details.

Use [`ValkeyModule_ReplySetAttributeLength()`](#ValkeyModule_ReplySetAttributeLength) to set deferred length.

Not supported by RESP2 and will return `VALKEYMODULE_ERR`, otherwise
the function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithNullArray"></span>

### `ValkeyModule_ReplyWithNullArray`

    int ValkeyModule_ReplyWithNullArray(ValkeyModuleCtx *ctx);

**Available since:** 6.0.0

Reply to the client with a null array, simply null in RESP3,
null array in RESP2.

Note: In RESP3 there's no difference between Null reply and
NullArray reply, so to prevent ambiguity it's better to avoid
using this API and use [`ValkeyModule_ReplyWithNull`](#ValkeyModule_ReplyWithNull) instead.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithEmptyArray"></span>

### `ValkeyModule_ReplyWithEmptyArray`

    int ValkeyModule_ReplyWithEmptyArray(ValkeyModuleCtx *ctx);

**Available since:** 6.0.0

Reply to the client with an empty array.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplySetArrayLength"></span>

### `ValkeyModule_ReplySetArrayLength`

    void ValkeyModule_ReplySetArrayLength(ValkeyModuleCtx *ctx, long len);

**Available since:** 4.0.0

When [`ValkeyModule_ReplyWithArray()`](#ValkeyModule_ReplyWithArray) is used with the argument
`VALKEYMODULE_POSTPONED_LEN`, because we don't know beforehand the number
of items we are going to output as elements of the array, this function
will take care to set the array length.

Since it is possible to have multiple array replies pending with unknown
length, this function guarantees to always set the latest array length
that was created in a postponed way.

For example in order to output an array like [1,[10,20,30]] we
could write:

     ValkeyModule_ReplyWithArray(ctx,VALKEYMODULE_POSTPONED_LEN);
     ValkeyModule_ReplyWithLongLong(ctx,1);
     ValkeyModule_ReplyWithArray(ctx,VALKEYMODULE_POSTPONED_LEN);
     ValkeyModule_ReplyWithLongLong(ctx,10);
     ValkeyModule_ReplyWithLongLong(ctx,20);
     ValkeyModule_ReplyWithLongLong(ctx,30);
     ValkeyModule_ReplySetArrayLength(ctx,3); // Set len of 10,20,30 array.
     ValkeyModule_ReplySetArrayLength(ctx,2); // Set len of top array

Note that in the above example there is no reason to postpone the array
length, since we produce a fixed number of elements, but in the practice
the code may use an iterator or other ways of creating the output so
that is not easy to calculate in advance the number of elements.

<span id="ValkeyModule_ReplySetMapLength"></span>

### `ValkeyModule_ReplySetMapLength`

    void ValkeyModule_ReplySetMapLength(ValkeyModuleCtx *ctx, long len);

**Available since:** 7.0.0

Very similar to [`ValkeyModule_ReplySetArrayLength`](#ValkeyModule_ReplySetArrayLength) except `len` should
exactly half of the number of `ReplyWith*` functions called in the
context of the map.
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

<span id="ValkeyModule_ReplySetSetLength"></span>

### `ValkeyModule_ReplySetSetLength`

    void ValkeyModule_ReplySetSetLength(ValkeyModuleCtx *ctx, long len);

**Available since:** 7.0.0

Very similar to [`ValkeyModule_ReplySetArrayLength`](#ValkeyModule_ReplySetArrayLength)
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

<span id="ValkeyModule_ReplySetAttributeLength"></span>

### `ValkeyModule_ReplySetAttributeLength`

    void ValkeyModule_ReplySetAttributeLength(ValkeyModuleCtx *ctx, long len);

**Available since:** 7.0.0

Very similar to [`ValkeyModule_ReplySetMapLength`](#ValkeyModule_ReplySetMapLength)
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

Must not be called if [`ValkeyModule_ReplyWithAttribute`](#ValkeyModule_ReplyWithAttribute) returned an error.

<span id="ValkeyModule_ReplyWithStringBuffer"></span>

### `ValkeyModule_ReplyWithStringBuffer`

    int ValkeyModule_ReplyWithStringBuffer(ValkeyModuleCtx *ctx,
                                           const char *buf,
                                           size_t len);

**Available since:** 4.0.0

Reply with a bulk string, taking in input a C buffer pointer and length.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithCString"></span>

### `ValkeyModule_ReplyWithCString`

    int ValkeyModule_ReplyWithCString(ValkeyModuleCtx *ctx, const char *buf);

**Available since:** 5.0.6

Reply with a bulk string, taking in input a C buffer pointer that is
assumed to be null-terminated.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithString"></span>

### `ValkeyModule_ReplyWithString`

    int ValkeyModule_ReplyWithString(ValkeyModuleCtx *ctx, ValkeyModuleString *str);

**Available since:** 4.0.0

Reply with a bulk string, taking in input a `ValkeyModuleString` object.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithEmptyString"></span>

### `ValkeyModule_ReplyWithEmptyString`

    int ValkeyModule_ReplyWithEmptyString(ValkeyModuleCtx *ctx);

**Available since:** 6.0.0

Reply with an empty string.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithVerbatimStringType"></span>

### `ValkeyModule_ReplyWithVerbatimStringType`

    int ValkeyModule_ReplyWithVerbatimStringType(ValkeyModuleCtx *ctx,
                                                 const char *buf,
                                                 size_t len,
                                                 const char *ext);

**Available since:** 7.0.0

Reply with a binary safe string, which should not be escaped or filtered
taking in input a C buffer pointer, length and a 3 character type/extension.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithVerbatimString"></span>

### `ValkeyModule_ReplyWithVerbatimString`

    int ValkeyModule_ReplyWithVerbatimString(ValkeyModuleCtx *ctx,
                                             const char *buf,
                                             size_t len);

**Available since:** 6.0.0

Reply with a binary safe string, which should not be escaped or filtered
taking in input a C buffer pointer and length.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithNull"></span>

### `ValkeyModule_ReplyWithNull`

    int ValkeyModule_ReplyWithNull(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Reply to the client with a NULL.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithBool"></span>

### `ValkeyModule_ReplyWithBool`

    int ValkeyModule_ReplyWithBool(ValkeyModuleCtx *ctx, int b);

**Available since:** 7.0.0

Reply with a RESP3 Boolean type.
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

In RESP3, this is boolean type
In RESP2, it's a string response of "1" and "0" for true and false respectively.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithCallReply"></span>

### `ValkeyModule_ReplyWithCallReply`

    int ValkeyModule_ReplyWithCallReply(ValkeyModuleCtx *ctx,
                                        ValkeyModuleCallReply *reply);

**Available since:** 4.0.0

Reply exactly what a command returned us with [`ValkeyModule_Call()`](#ValkeyModule_Call).
This function is useful when we use [`ValkeyModule_Call()`](#ValkeyModule_Call) in order to
execute some command, as we want to reply to the client exactly the
same reply we obtained by the command.

Return:
- `VALKEYMODULE_OK` on success.
- `VALKEYMODULE_ERR` if the given reply is in RESP3 format but the client expects RESP2.
  In case of an error, it's the module writer responsibility to translate the reply
  to RESP2 (or handle it differently by returning an error). Notice that for
  module writer convenience, it is possible to pass `0` as a parameter to the fmt
  argument of [`ValkeyModule_Call`](#ValkeyModule_Call) so that the `ValkeyModuleCallReply` will return in the same
  protocol (RESP2 or RESP3) as set in the current client's context.

<span id="ValkeyModule_ReplyWithDouble"></span>

### `ValkeyModule_ReplyWithDouble`

    int ValkeyModule_ReplyWithDouble(ValkeyModuleCtx *ctx, double d);

**Available since:** 4.0.0

Reply with a RESP3 Double type.
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

Send a string reply obtained converting the double 'd' into a bulk string.
This function is basically equivalent to converting a double into
a string into a C buffer, and then calling the function
[`ValkeyModule_ReplyWithStringBuffer()`](#ValkeyModule_ReplyWithStringBuffer) with the buffer and length.

In RESP3 the string is tagged as a double, while in RESP2 it's just a plain string
that the user will have to parse.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithBigNumber"></span>

### `ValkeyModule_ReplyWithBigNumber`

    int ValkeyModule_ReplyWithBigNumber(ValkeyModuleCtx *ctx,
                                        const char *bignum,
                                        size_t len);

**Available since:** 7.0.0

Reply with a RESP3 BigNumber type.
Visit [https://valkey.io/topics/protocol](https://valkey.io/topics/protocol) for more info about RESP3.

In RESP3, this is a string of length `len` that is tagged as a BigNumber,
however, it's up to the caller to ensure that it's a valid BigNumber.
In RESP2, this is just a plain bulk string response.

The function always returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_ReplyWithLongDouble"></span>

### `ValkeyModule_ReplyWithLongDouble`

    int ValkeyModule_ReplyWithLongDouble(ValkeyModuleCtx *ctx, long double ld);

**Available since:** 6.0.0

Send a string reply obtained converting the long double 'ld' into a bulk
string. This function is basically equivalent to converting a long double
into a string into a C buffer, and then calling the function
[`ValkeyModule_ReplyWithStringBuffer()`](#ValkeyModule_ReplyWithStringBuffer) with the buffer and length.
The double string uses human readable formatting (see
`addReplyHumanLongDouble` in networking.c).

The function always returns `VALKEYMODULE_OK`.

<span id="section-commands-replication-api"></span>

## Commands replication API

<span id="ValkeyModule_Replicate"></span>

### `ValkeyModule_Replicate`

    int ValkeyModule_Replicate(ValkeyModuleCtx *ctx,
                               const char *cmdname,
                               const char *fmt,
                               ...);

**Available since:** 4.0.0

Replicate the specified command and arguments to replicas and AOF, as effect
of execution of the calling command implementation.

The replicated commands are always wrapped into the MULTI/EXEC that
contains all the commands replicated in a given module command
execution. However the commands replicated with [`ValkeyModule_Call()`](#ValkeyModule_Call)
are the first items, the ones replicated with [`ValkeyModule_Replicate()`](#ValkeyModule_Replicate)
will all follow before the EXEC.

Modules should try to use one interface or the other.

This command follows exactly the same interface of [`ValkeyModule_Call()`](#ValkeyModule_Call),
so a set of format specifiers must be passed, followed by arguments
matching the provided format specifiers.

Please refer to [`ValkeyModule_Call()`](#ValkeyModule_Call) for more information.

Using the special "A" and "R" modifiers, the caller can exclude either
the AOF or the replicas from the propagation of the specified command.
Otherwise, by default, the command will be propagated in both channels.

#### Note about calling this function from a thread safe context:

Normally when you call this function from the callback implementing a
module command, or any other callback provided by the Module API,
The server will accumulate all the calls to this function in the context of
the callback, and will propagate all the commands wrapped in a MULTI/EXEC
transaction. However when calling this function from a threaded safe context
that can live an undefined amount of time, and can be locked/unlocked in
at will, the behavior is different: MULTI/EXEC wrapper is not emitted
and the command specified is inserted in the AOF and replication stream
immediately.

#### Return value

The command returns `VALKEYMODULE_ERR` if the format specifiers are invalid
or the command name does not belong to a known command.

<span id="ValkeyModule_ReplicateVerbatim"></span>

### `ValkeyModule_ReplicateVerbatim`

    int ValkeyModule_ReplicateVerbatim(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

This function will replicate the command exactly as it was invoked
by the client. Note that this function will not wrap the command into
a MULTI/EXEC stanza, so it should not be mixed with other replication
commands.

Basically this form of replication is useful when you want to propagate
the command to the replicas and AOF file exactly as it was called, since
the command can just be re-executed to deterministically re-create the
new state starting from the old one.

The function always returns `VALKEYMODULE_OK`.

<span id="section-db-and-key-apis-generic-api"></span>

## DB and Key APIs – Generic API

<span id="ValkeyModule_GetClientId"></span>

### `ValkeyModule_GetClientId`

    unsigned long long ValkeyModule_GetClientId(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Return the ID of the current client calling the currently active module
command. The returned ID has a few guarantees:

1. The ID is different for each different client, so if the same client
   executes a module command multiple times, it can be recognized as
   having the same ID, otherwise the ID will be different.
2. The ID increases monotonically. Clients connecting to the server later
   are guaranteed to get IDs greater than any past ID previously seen.

Valid IDs are from 1 to 2^64 - 1. If 0 is returned it means there is no way
to fetch the ID in the context the function was currently called.

After obtaining the ID, it is possible to check if the command execution
is actually happening in the context of AOF loading, using this macro:

     if (ValkeyModule_IsAOFClient(ValkeyModule_GetClientId(ctx)) {
         // Handle it differently.
     }

<span id="ValkeyModule_GetClientUserNameById"></span>

### `ValkeyModule_GetClientUserNameById`

    ValkeyModuleString *ValkeyModule_GetClientUserNameById(ValkeyModuleCtx *ctx,
                                                           uint64_t id);

**Available since:** 6.2.1

Return the ACL user name used by the client with the specified client ID.
Client ID can be obtained with [`ValkeyModule_GetClientId()`](#ValkeyModule_GetClientId) API. If the client does not
exist, NULL is returned and errno is set to ENOENT. If the client isn't
using an ACL user, NULL is returned and errno is set to ENOTSUP

<span id="ValkeyModule_MustObeyClient"></span>

### `ValkeyModule_MustObeyClient`

    int ValkeyModule_MustObeyClient(ValkeyModuleCtx *ctx);

**Available since:** 8.1.0

Returns 1 if commands are arriving from the primary client or AOF client
and should never be rejected.
This check can be used in places such as skipping validation of commands
on replicas (to not diverge from primary) or from AOF files.
Returns 0 otherwise (and also if ctx or if the client is NULL).

<span id="ValkeyModule_GetClientInfoById"></span>

### `ValkeyModule_GetClientInfoById`

    int ValkeyModule_GetClientInfoById(void *ci, uint64_t id);

**Available since:** 6.0.0

Return information about the client with the specified ID (that was
previously obtained via the [`ValkeyModule_GetClientId()`](#ValkeyModule_GetClientId) API). If the
client exists, `VALKEYMODULE_OK` is returned, otherwise `VALKEYMODULE_ERR`
is returned.

When the client exist and the `ci` pointer is not NULL, but points to
a structure of type `ValkeyModuleClientInfoV`1, previously initialized with
the correct `VALKEYMODULE_CLIENTINFO_INITIALIZER_V1`, the structure is populated
with the following fields:

     uint64_t flags;         // VALKEYMODULE_CLIENTINFO_FLAG_*
     uint64_t id;            // Client ID
     char addr[46];          // IPv4 or IPv6 address.
     uint16_t port;          // TCP port.
     uint16_t db;            // Selected DB.

Note: the client ID is useless in the context of this call, since we
      already know, however the same structure could be used in other
      contexts where we don't know the client ID, yet the same structure
      is returned.

With flags having the following meaning:

    VALKEYMODULE_CLIENTINFO_FLAG_SSL          Client using SSL connection.
    VALKEYMODULE_CLIENTINFO_FLAG_PUBSUB       Client in Pub/Sub mode.
    VALKEYMODULE_CLIENTINFO_FLAG_BLOCKED      Client blocked in command.
    VALKEYMODULE_CLIENTINFO_FLAG_TRACKING     Client with keys tracking on.
    VALKEYMODULE_CLIENTINFO_FLAG_UNIXSOCKET   Client using unix domain socket.
    VALKEYMODULE_CLIENTINFO_FLAG_MULTI        Client in MULTI state.
    VALKEYMODULE_CLIENTINFO_FLAG_READONLY     Client in ReadOnly state.

However passing NULL is a way to just check if the client exists in case
we are not interested in any additional information.

This is the correct usage when we want the client info structure
returned:

     ValkeyModuleClientInfo ci = VALKEYMODULE_CLIENTINFO_INITIALIZER;
     int retval = ValkeyModule_GetClientInfoById(&ci,client_id);
     if (retval == VALKEYMODULE_OK) {
         printf("Address: %s\n", ci.addr);
     }

<span id="ValkeyModule_GetClientNameById"></span>

### `ValkeyModule_GetClientNameById`

    ValkeyModuleString *ValkeyModule_GetClientNameById(ValkeyModuleCtx *ctx,
                                                       uint64_t id);

**Available since:** 7.0.3

Returns the name of the client connection with the given ID.

If the client ID does not exist or if the client has no name associated with
it, NULL is returned.

<span id="ValkeyModule_SetClientNameById"></span>

### `ValkeyModule_SetClientNameById`

    int ValkeyModule_SetClientNameById(uint64_t id, ValkeyModuleString *name);

**Available since:** 7.0.3

Sets the name of the client with the given ID. This is equivalent to the client calling
`CLIENT SETNAME name`.

Returns `VALKEYMODULE_OK` on success. On failure, `VALKEYMODULE_ERR` is returned
and errno is set as follows:

- ENOENT if the client does not exist
- EINVAL if the name contains invalid characters

<span id="ValkeyModule_PublishMessage"></span>

### `ValkeyModule_PublishMessage`

    int ValkeyModule_PublishMessage(ValkeyModuleCtx *ctx,
                                    ValkeyModuleString *channel,
                                    ValkeyModuleString *message);

**Available since:** 6.0.0

Publish a message to subscribers (see PUBLISH command).

<span id="ValkeyModule_PublishMessageShard"></span>

### `ValkeyModule_PublishMessageShard`

    int ValkeyModule_PublishMessageShard(ValkeyModuleCtx *ctx,
                                         ValkeyModuleString *channel,
                                         ValkeyModuleString *message);

**Available since:** 7.0.0

Publish a message to shard-subscribers (see SPUBLISH command).

<span id="ValkeyModule_GetSelectedDb"></span>

### `ValkeyModule_GetSelectedDb`

    int ValkeyModule_GetSelectedDb(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Return the currently selected DB.

<span id="ValkeyModule_GetContextFlags"></span>

### `ValkeyModule_GetContextFlags`

    int ValkeyModule_GetContextFlags(ValkeyModuleCtx *ctx);

**Available since:** 4.0.3

Return the current context's flags. The flags provide information on the
current request context (whether the client is a Lua script or in a MULTI),
and about the instance in general, i.e replication and persistence.

It is possible to call this function even with a NULL context, however
in this case the following flags will not be reported:

 * LUA, MULTI, REPLICATED, DIRTY (see below for more info).

Available flags and their meaning:

 * `VALKEYMODULE_CTX_FLAGS_LUA`: The command is running in a Lua script

 * `VALKEYMODULE_CTX_FLAGS_MULTI`: The command is running inside a transaction

 * `VALKEYMODULE_CTX_FLAGS_REPLICATED`: The command was sent over the replication
   link by the PRIMARY

 * `VALKEYMODULE_CTX_FLAGS_PRIMARY`: The instance is a primary

 * `VALKEYMODULE_CTX_FLAGS_REPLICA`: The instance is a replica

 * `VALKEYMODULE_CTX_FLAGS_READONLY`: The instance is read-only

 * `VALKEYMODULE_CTX_FLAGS_CLUSTER`: The instance is in cluster mode

 * `VALKEYMODULE_CTX_FLAGS_AOF`: The instance has AOF enabled

 * `VALKEYMODULE_CTX_FLAGS_RDB`: The instance has RDB enabled

 * `VALKEYMODULE_CTX_FLAGS_MAXMEMORY`:  The instance has Maxmemory set

 * `VALKEYMODULE_CTX_FLAGS_EVICT`:  Maxmemory is set and has an eviction
   policy that may delete keys

 * `VALKEYMODULE_CTX_FLAGS_OOM`: The server is out of memory according to the
   maxmemory setting.

 * `VALKEYMODULE_CTX_FLAGS_OOM_WARNING`: Less than 25% of memory remains before
                                      reaching the maxmemory level.

 * `VALKEYMODULE_CTX_FLAGS_LOADING`: Server is loading RDB/AOF

 * `VALKEYMODULE_CTX_FLAGS_REPLICA_IS_STALE`: No active link with the primary.

 * `VALKEYMODULE_CTX_FLAGS_REPLICA_IS_CONNECTING`: The replica is trying to
                                                connect with the primary.

 * `VALKEYMODULE_CTX_FLAGS_REPLICA_IS_TRANSFERRING`: primary -> Replica RDB
                                                  transfer is in progress.

 * `VALKEYMODULE_CTX_FLAGS_REPLICA_IS_ONLINE`: The replica has an active link
                                            with its primary. This is the
                                            contrary of STALE state.

 * `VALKEYMODULE_CTX_FLAGS_ACTIVE_CHILD`: There is currently some background
                                       process active (RDB, AUX or module).

 * `VALKEYMODULE_CTX_FLAGS_MULTI_DIRTY`: The next EXEC will fail due to dirty
                                      CAS (touched keys).

 * `VALKEYMODULE_CTX_FLAGS_IS_CHILD`: The server is currently running inside
                                   background child process.

 * `VALKEYMODULE_CTX_FLAGS_RESP3`: Indicate the that client attached to this
                                context is using RESP3.

 * `VALKEYMODULE_CTX_FLAGS_SERVER_STARTUP`: The instance is starting

 * `VALKEYMODULE_CTX_FLAGS_SLOT_IMPORT_CLIENT`: Indicate the that client attached to this
                                              context is the slot import client.

 * `VALKEYMODULE_CTX_FLAGS_SLOT_EXPORT_CLIENT`: Indicate the that client attached to this
                                              context is the slot export client.

<span id="ValkeyModule_AvoidReplicaTraffic"></span>

### `ValkeyModule_AvoidReplicaTraffic`

    int ValkeyModule_AvoidReplicaTraffic(void);

**Available since:** 6.0.0

Returns true if a client sent the CLIENT PAUSE command to the server or
if the Cluster does a manual failover, pausing the clients.
This is needed when we have a primary with replicas, and want to write,
without adding further data to the replication channel, that the replicas
replication offset, match the one of the primary. When this happens, it is
safe to failover the primary without data loss.

However modules may generate traffic by calling [`ValkeyModule_Call()`](#ValkeyModule_Call) with
the "!" flag, or by calling [`ValkeyModule_Replicate()`](#ValkeyModule_Replicate), in a context outside
commands execution, for instance in timeout callbacks, threads safe
contexts, and so forth. When modules will generate too much traffic, it
will be hard for the primary and replicas offset to match, because there
is more data to send in the replication channel.

So modules may want to try to avoid very heavy background work that has
the effect of creating data to the replication channel, when this function
returns true. This is mostly useful for modules that have background
garbage collection tasks, or that do writes and replicate such writes
periodically in timer callbacks or other periodic callbacks.

<span id="ValkeyModule_SelectDb"></span>

### `ValkeyModule_SelectDb`

    int ValkeyModule_SelectDb(ValkeyModuleCtx *ctx, int newid);

**Available since:** 4.0.0

Change the currently selected DB. Returns an error if the id
is out of range.

Note that the client will retain the currently selected DB even after
the command implemented by the module calling this function
returns.

If the module command wishes to change something in a different DB and
returns back to the original one, it should call [`ValkeyModule_GetSelectedDb()`](#ValkeyModule_GetSelectedDb)
before in order to restore the old DB number before returning.

<span id="ValkeyModule_KeyExists"></span>

### `ValkeyModule_KeyExists`

    int ValkeyModule_KeyExists(ValkeyModuleCtx *ctx, robj *keyname);

**Available since:** 7.0.0

Check if a key exists, without affecting its last access time.

This is equivalent to calling [`ValkeyModule_OpenKey`](#ValkeyModule_OpenKey) with the mode `VALKEYMODULE_READ` |
`VALKEYMODULE_OPEN_KEY_NOTOUCH`, then checking if NULL was returned and, if not,
calling [`ValkeyModule_CloseKey`](#ValkeyModule_CloseKey) on the opened key.

<span id="ValkeyModule_OpenKey"></span>

### `ValkeyModule_OpenKey`

    ValkeyModuleKey *ValkeyModule_OpenKey(ValkeyModuleCtx *ctx,
                                          robj *keyname,
                                          int mode);

**Available since:** 4.0.0

Return a handle representing a key, so that it is possible
to call other APIs with the key handle as argument to perform
operations on the key.

The return value is the handle representing the key, that must be
closed with [`ValkeyModule_CloseKey()`](#ValkeyModule_CloseKey).

If the key does not exist and `VALKEYMODULE_WRITE` mode is requested, the handle
is still returned, since it is possible to perform operations on
a yet not existing key (that will be created, for example, after
a list push operation). If the mode is just `VALKEYMODULE_READ` instead, and the
key does not exist, NULL is returned. However it is still safe to
call [`ValkeyModule_CloseKey()`](#ValkeyModule_CloseKey) and [`ValkeyModule_KeyType()`](#ValkeyModule_KeyType) on a NULL
value.

Extra flags that can be pass to the API under the mode argument:
* `VALKEYMODULE_OPEN_KEY_NOTOUCH` - Avoid touching the LRU/LFU of the key when opened.
* `VALKEYMODULE_OPEN_KEY_NONOTIFY` - Don't trigger keyspace event on key misses.
* `VALKEYMODULE_OPEN_KEY_NOSTATS` - Don't update keyspace hits/misses counters.
* `VALKEYMODULE_OPEN_KEY_NOEXPIRE` - Avoid deleting lazy expired keys.
* `VALKEYMODULE_OPEN_KEY_NOEFFECTS` - Avoid any effects from fetching the key.

<span id="ValkeyModule_GetOpenKeyModesAll"></span>

### `ValkeyModule_GetOpenKeyModesAll`

    int ValkeyModule_GetOpenKeyModesAll(void);

**Available since:** 7.2.0


Returns the full OpenKey modes mask, using the return value
the module can check if a certain set of OpenKey modes are supported
by the server version in use.
Example:

       int supportedMode = ValkeyModule_GetOpenKeyModesAll();
       if (supportedMode & VALKEYMODULE_OPEN_KEY_NOTOUCH) {
             // VALKEYMODULE_OPEN_KEY_NOTOUCH is supported
       } else{
             // VALKEYMODULE_OPEN_KEY_NOTOUCH is not supported
       }

<span id="ValkeyModule_CloseKey"></span>

### `ValkeyModule_CloseKey`

    void ValkeyModule_CloseKey(ValkeyModuleKey *key);

**Available since:** 4.0.0

Close a key handle. The key handle is freed and should not be accessed anymore.

<span id="ValkeyModule_KeyType"></span>

### `ValkeyModule_KeyType`

    int ValkeyModule_KeyType(ValkeyModuleKey *key);

**Available since:** 4.0.0

Return the type of the key. If the key pointer is NULL then
`VALKEYMODULE_KEYTYPE_EMPTY` is returned.

<span id="ValkeyModule_ValueLength"></span>

### `ValkeyModule_ValueLength`

    size_t ValkeyModule_ValueLength(ValkeyModuleKey *key);

**Available since:** 4.0.0

Return the length of the value associated with the key.
For strings this is the length of the string. For all the other types
is the number of elements (just counting keys for hashes).

If the key pointer is NULL or the key is empty, zero is returned.

<span id="ValkeyModule_DeleteKey"></span>

### `ValkeyModule_DeleteKey`

    int ValkeyModule_DeleteKey(ValkeyModuleKey *key);

**Available since:** 4.0.0

If the key is open for writing, remove it, and setup the key to
accept new writes as an empty key (that will be created on demand).
On success `VALKEYMODULE_OK` is returned. If the key is not open for
writing `VALKEYMODULE_ERR` is returned.

<span id="ValkeyModule_UnlinkKey"></span>

### `ValkeyModule_UnlinkKey`

    int ValkeyModule_UnlinkKey(ValkeyModuleKey *key);

**Available since:** 4.0.7

If the key is open for writing, unlink it (that is delete it in a
non-blocking way, not reclaiming memory immediately) and setup the key to
accept new writes as an empty key (that will be created on demand).
On success `VALKEYMODULE_OK` is returned. If the key is not open for
writing `VALKEYMODULE_ERR` is returned.

<span id="ValkeyModule_GetExpire"></span>

### `ValkeyModule_GetExpire`

    mstime_t ValkeyModule_GetExpire(ValkeyModuleKey *key);

**Available since:** 4.0.0

Return the key expire value, as milliseconds of remaining TTL.
If no TTL is associated with the key or if the key is empty,
`VALKEYMODULE_NO_EXPIRE` is returned.

<span id="ValkeyModule_SetExpire"></span>

### `ValkeyModule_SetExpire`

    int ValkeyModule_SetExpire(ValkeyModuleKey *key, mstime_t expire);

**Available since:** 4.0.0

Set a new expire for the key. If the special expire
`VALKEYMODULE_NO_EXPIRE` is set, the expire is cancelled if there was
one (the same as the PERSIST command).

Note that the expire must be provided as a positive integer representing
the number of milliseconds of TTL the key should have.

The function returns `VALKEYMODULE_OK` on success or `VALKEYMODULE_ERR` if
the key was not open for writing or is an empty key.

<span id="ValkeyModule_GetAbsExpire"></span>

### `ValkeyModule_GetAbsExpire`

    mstime_t ValkeyModule_GetAbsExpire(ValkeyModuleKey *key);

**Available since:** 6.2.2

Return the key expire value, as absolute Unix timestamp.
If no TTL is associated with the key or if the key is empty,
`VALKEYMODULE_NO_EXPIRE` is returned.

<span id="ValkeyModule_SetAbsExpire"></span>

### `ValkeyModule_SetAbsExpire`

    int ValkeyModule_SetAbsExpire(ValkeyModuleKey *key, mstime_t expire);

**Available since:** 6.2.2

Set a new expire for the key. If the special expire
`VALKEYMODULE_NO_EXPIRE` is set, the expire is cancelled if there was
one (the same as the PERSIST command).

Note that the expire must be provided as a positive integer representing
the absolute Unix timestamp the key should have.

The function returns `VALKEYMODULE_OK` on success or `VALKEYMODULE_ERR` if
the key was not open for writing or is an empty key.

<span id="ValkeyModule_ResetDataset"></span>

### `ValkeyModule_ResetDataset`

    void ValkeyModule_ResetDataset(int restart_aof, int async);

**Available since:** 6.0.0

Performs similar operation to FLUSHALL, and optionally start a new AOF file (if enabled)
If `restart_aof` is true, you must make sure the command that triggered this call is not
propagated to the AOF file.
When async is set to true, db contents will be freed by a background thread.

<span id="ValkeyModule_DbSize"></span>

### `ValkeyModule_DbSize`

    unsigned long long ValkeyModule_DbSize(ValkeyModuleCtx *ctx);

**Available since:** 6.0.0

Returns the number of keys in the current db.

<span id="ValkeyModule_RandomKey"></span>

### `ValkeyModule_RandomKey`

    ValkeyModuleString *ValkeyModule_RandomKey(ValkeyModuleCtx *ctx);

**Available since:** 6.0.0

Returns a name of a random key, or NULL if current db is empty.

<span id="ValkeyModule_GetKeyNameFromOptCtx"></span>

### `ValkeyModule_GetKeyNameFromOptCtx`

    const ValkeyModuleString *ValkeyModule_GetKeyNameFromOptCtx(ValkeyModuleKeyOptCtx *ctx);

**Available since:** 7.0.0

Returns the name of the key currently being processed.

<span id="ValkeyModule_GetToKeyNameFromOptCtx"></span>

### `ValkeyModule_GetToKeyNameFromOptCtx`

    const ValkeyModuleString *ValkeyModule_GetToKeyNameFromOptCtx(ValkeyModuleKeyOptCtx *ctx);

**Available since:** 7.0.0

Returns the name of the target key currently being processed.

<span id="ValkeyModule_GetDbIdFromOptCtx"></span>

### `ValkeyModule_GetDbIdFromOptCtx`

    int ValkeyModule_GetDbIdFromOptCtx(ValkeyModuleKeyOptCtx *ctx);

**Available since:** 7.0.0

Returns the dbid currently being processed.

<span id="ValkeyModule_GetToDbIdFromOptCtx"></span>

### `ValkeyModule_GetToDbIdFromOptCtx`

    int ValkeyModule_GetToDbIdFromOptCtx(ValkeyModuleKeyOptCtx *ctx);

**Available since:** 7.0.0

Returns the target dbid currently being processed.

<span id="section-key-api-for-string-type"></span>

## Key API for String type

See also [`ValkeyModule_ValueLength()`](#ValkeyModule_ValueLength), which returns the length of a string.

<span id="ValkeyModule_StringSet"></span>

### `ValkeyModule_StringSet`

    int ValkeyModule_StringSet(ValkeyModuleKey *key, ValkeyModuleString *str);

**Available since:** 4.0.0

If the key is open for writing, set the specified string 'str' as the
value of the key, deleting the old value if any.
On success `VALKEYMODULE_OK` is returned. If the key is not open for
writing or there is an active iterator, `VALKEYMODULE_ERR` is returned.

<span id="ValkeyModule_StringDMA"></span>

### `ValkeyModule_StringDMA`

    char *ValkeyModule_StringDMA(ValkeyModuleKey *key, size_t *len, int mode);

**Available since:** 4.0.0

Prepare the key associated string value for DMA access, and returns
a pointer and size (by reference), that the user can use to read or
modify the string in-place accessing it directly via pointer.

The 'mode' is composed by bitwise OR-ing the following flags:

    VALKEYMODULE_READ -- Read access
    VALKEYMODULE_WRITE -- Write access

If the DMA is not requested for writing, the pointer returned should
only be accessed in a read-only fashion.

On error (wrong type) NULL is returned.

DMA access rules:

1. No other key writing function should be called since the moment
the pointer is obtained, for all the time we want to use DMA access
to read or modify the string.

2. Each time [`ValkeyModule_StringTruncate()`](#ValkeyModule_StringTruncate) is called, to continue with the DMA
access, [`ValkeyModule_StringDMA()`](#ValkeyModule_StringDMA) should be called again to re-obtain
a new pointer and length.

3. If the returned pointer is not NULL, but the length is zero, no
byte can be touched (the string is empty, or the key itself is empty)
so a [`ValkeyModule_StringTruncate()`](#ValkeyModule_StringTruncate) call should be used if there is to enlarge
the string, and later call StringDMA() again to get the pointer.

<span id="ValkeyModule_StringTruncate"></span>

### `ValkeyModule_StringTruncate`

    int ValkeyModule_StringTruncate(ValkeyModuleKey *key, size_t newlen);

**Available since:** 4.0.0

If the key is open for writing and is of string type, resize it, padding
with zero bytes if the new length is greater than the old one.

After this call, [`ValkeyModule_StringDMA()`](#ValkeyModule_StringDMA) must be called again to continue
DMA access with the new pointer.

The function returns `VALKEYMODULE_OK` on success, and `VALKEYMODULE_ERR` on
error, that is, the key is not open for writing, is not a string
or resizing for more than 512 MB is requested.

If the key is empty, a string key is created with the new string value
unless the new length value requested is zero.

<span id="section-key-api-for-list-type"></span>

## Key API for List type

Many of the list functions access elements by index. Since a list is in
essence a doubly-linked list, accessing elements by index is generally an
O(N) operation. However, if elements are accessed sequentially or with
indices close together, the functions are optimized to seek the index from
the previous index, rather than seeking from the ends of the list.

This enables iteration to be done efficiently using a simple for loop:

    long n = ValkeyModule_ValueLength(key);
    for (long i = 0; i < n; i++) {
        ValkeyModuleString *elem = ValkeyModule_ListGet(key, i);
        // Do stuff...
    }

Note that after modifying a list using [`ValkeyModule_ListPop`](#ValkeyModule_ListPop), [`ValkeyModule_ListSet`](#ValkeyModule_ListSet) or
[`ValkeyModule_ListInsert`](#ValkeyModule_ListInsert), the internal iterator is invalidated so the next operation
will require a linear seek.

Modifying a list in any another way, for example using [`ValkeyModule_Call()`](#ValkeyModule_Call), while a key
is open will confuse the internal iterator and may cause trouble if the key
is used after such modifications. The key must be reopened in this case.

See also [`ValkeyModule_ValueLength()`](#ValkeyModule_ValueLength), which returns the length of a list.

<span id="ValkeyModule_ListPush"></span>

### `ValkeyModule_ListPush`

    int ValkeyModule_ListPush(ValkeyModuleKey *key,
                              int where,
                              ValkeyModuleString *ele);

**Available since:** 4.0.0

Push an element into a list, on head or tail depending on 'where' argument
(`VALKEYMODULE_LIST_HEAD` or `VALKEYMODULE_LIST_TAIL`). If the key refers to an
empty key opened for writing, the key is created. On success, `VALKEYMODULE_OK`
is returned. On failure, `VALKEYMODULE_ERR` is returned and `errno` is set as
follows:

- EINVAL if key or ele is NULL.
- ENOTSUP if the key is of another type than list.
- EBADF if the key is not opened for writing.

Note: Before Redis OSS 7.0, `errno` was not set by this function.

<span id="ValkeyModule_ListPop"></span>

### `ValkeyModule_ListPop`

    ValkeyModuleString *ValkeyModule_ListPop(ValkeyModuleKey *key, int where);

**Available since:** 4.0.0

Pop an element from the list, and returns it as a module string object
that the user should be free with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by enabling
automatic memory. The `where` argument specifies if the element should be
popped from the beginning or the end of the list (`VALKEYMODULE_LIST_HEAD` or
`VALKEYMODULE_LIST_TAIL`). On failure, the command returns NULL and sets
`errno` as follows:

- EINVAL if key is NULL.
- ENOTSUP if the key is empty or of another type than list.
- EBADF if the key is not opened for writing.

Note: Before Redis OSS 7.0, `errno` was not set by this function.

<span id="ValkeyModule_ListGet"></span>

### `ValkeyModule_ListGet`

    ValkeyModuleString *ValkeyModule_ListGet(ValkeyModuleKey *key, long index);

**Available since:** 7.0.0

Returns the element at index `index` in the list stored at `key`, like the
LINDEX command. The element should be free'd using [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or using
automatic memory management.

The index is zero-based, so 0 means the first element, 1 the second element
and so on. Negative indices can be used to designate elements starting at the
tail of the list. Here, -1 means the last element, -2 means the penultimate
and so forth.

When no value is found at the given key and index, NULL is returned and
`errno` is set as follows:

- EINVAL if key is NULL.
- ENOTSUP if the key is not a list.
- EBADF if the key is not opened for reading.
- EDOM if the index is not a valid index in the list.

<span id="ValkeyModule_ListSet"></span>

### `ValkeyModule_ListSet`

    int ValkeyModule_ListSet(ValkeyModuleKey *key,
                             long index,
                             ValkeyModuleString *value);

**Available since:** 7.0.0

Replaces the element at index `index` in the list stored at `key`.

The index is zero-based, so 0 means the first element, 1 the second element
and so on. Negative indices can be used to designate elements starting at the
tail of the list. Here, -1 means the last element, -2 means the penultimate
and so forth.

On success, `VALKEYMODULE_OK` is returned. On failure, `VALKEYMODULE_ERR` is
returned and `errno` is set as follows:

- EINVAL if key or value is NULL.
- ENOTSUP if the key is not a list.
- EBADF if the key is not opened for writing.
- EDOM if the index is not a valid index in the list.

<span id="ValkeyModule_ListInsert"></span>

### `ValkeyModule_ListInsert`

    int ValkeyModule_ListInsert(ValkeyModuleKey *key,
                                long index,
                                ValkeyModuleString *value);

**Available since:** 7.0.0

Inserts an element at the given index.

The index is zero-based, so 0 means the first element, 1 the second element
and so on. Negative indices can be used to designate elements starting at the
tail of the list. Here, -1 means the last element, -2 means the penultimate
and so forth. The index is the element's index after inserting it.

On success, `VALKEYMODULE_OK` is returned. On failure, `VALKEYMODULE_ERR` is
returned and `errno` is set as follows:

- EINVAL if key or value is NULL.
- ENOTSUP if the key of another type than list.
- EBADF if the key is not opened for writing.
- EDOM if the index is not a valid index in the list.

<span id="ValkeyModule_ListDelete"></span>

### `ValkeyModule_ListDelete`

    int ValkeyModule_ListDelete(ValkeyModuleKey *key, long index);

**Available since:** 7.0.0

Removes an element at the given index. The index is 0-based. A negative index
can also be used, counting from the end of the list.

On success, `VALKEYMODULE_OK` is returned. On failure, `VALKEYMODULE_ERR` is
returned and `errno` is set as follows:

- EINVAL if key or value is NULL.
- ENOTSUP if the key is not a list.
- EBADF if the key is not opened for writing.
- EDOM if the index is not a valid index in the list.

<span id="section-key-api-for-sorted-set-type"></span>

## Key API for Sorted Set type

See also [`ValkeyModule_ValueLength()`](#ValkeyModule_ValueLength), which returns the length of a sorted set.

<span id="ValkeyModule_ZsetAdd"></span>

### `ValkeyModule_ZsetAdd`

    int ValkeyModule_ZsetAdd(ValkeyModuleKey *key,
                             double score,
                             ValkeyModuleString *ele,
                             int *flagsptr);

**Available since:** 4.0.0

Add a new element into a sorted set, with the specified 'score'.
If the element already exists, the score is updated.

A new sorted set is created at value if the key is an empty open key
setup for writing.

Additional flags can be passed to the function via a pointer, the flags
are both used to receive input and to communicate state when the function
returns. 'flagsptr' can be NULL if no special flags are used.

The input flags are:

    VALKEYMODULE_ZADD_XX: Element must already exist. Do nothing otherwise.
    VALKEYMODULE_ZADD_NX: Element must not exist. Do nothing otherwise.
    VALKEYMODULE_ZADD_GT: If element exists, new score must be greater than the current score.
                         Do nothing otherwise. Can optionally be combined with XX.
    VALKEYMODULE_ZADD_LT: If element exists, new score must be less than the current score.
                         Do nothing otherwise. Can optionally be combined with XX.

The output flags are:

    VALKEYMODULE_ZADD_ADDED: The new element was added to the sorted set.
    VALKEYMODULE_ZADD_UPDATED: The score of the element was updated.
    VALKEYMODULE_ZADD_NOP: No operation was performed because XX or NX flags.

On success the function returns `VALKEYMODULE_OK`. On the following errors
`VALKEYMODULE_ERR` is returned:

* The key was not opened for writing.
* The key is of the wrong type.
* 'score' double value is not a number (NaN).

<span id="ValkeyModule_ZsetIncrby"></span>

### `ValkeyModule_ZsetIncrby`

    int ValkeyModule_ZsetIncrby(ValkeyModuleKey *key,
                                double score,
                                ValkeyModuleString *ele,
                                int *flagsptr,
                                double *newscore);

**Available since:** 4.0.0

This function works exactly like [`ValkeyModule_ZsetAdd()`](#ValkeyModule_ZsetAdd), but instead of setting
a new score, the score of the existing element is incremented, or if the
element does not already exist, it is added assuming the old score was
zero.

The input and output flags, and the return value, have the same exact
meaning, with the only difference that this function will return
`VALKEYMODULE_ERR` even when 'score' is a valid double number, but adding it
to the existing score results into a NaN (not a number) condition.

This function has an additional field 'newscore', if not NULL is filled
with the new score of the element after the increment, if no error
is returned.

<span id="ValkeyModule_ZsetRem"></span>

### `ValkeyModule_ZsetRem`

    int ValkeyModule_ZsetRem(ValkeyModuleKey *key,
                             ValkeyModuleString *ele,
                             int *deleted);

**Available since:** 4.0.0

Remove the specified element from the sorted set.
The function returns `VALKEYMODULE_OK` on success, and `VALKEYMODULE_ERR`
on one of the following conditions:

* The key was not opened for writing.
* The key is of the wrong type.

The return value does NOT indicate the fact the element was really
removed (since it existed) or not, just if the function was executed
with success.

In order to know if the element was removed, the additional argument
'deleted' must be passed, that populates the integer by reference
setting it to 1 or 0 depending on the outcome of the operation.
The 'deleted' argument can be NULL if the caller is not interested
to know if the element was really removed.

Empty keys will be handled correctly by doing nothing.

<span id="ValkeyModule_ZsetScore"></span>

### `ValkeyModule_ZsetScore`

    int ValkeyModule_ZsetScore(ValkeyModuleKey *key,
                               ValkeyModuleString *ele,
                               double *score);

**Available since:** 4.0.0

On success retrieve the double score associated at the sorted set element
'ele' and returns `VALKEYMODULE_OK`. Otherwise `VALKEYMODULE_ERR` is returned
to signal one of the following conditions:

* There is no such element 'ele' in the sorted set.
* The key is not a sorted set.
* The key is an open empty key.

<span id="section-key-api-for-sorted-set-iterator"></span>

## Key API for Sorted Set iterator

<span id="ValkeyModule_ZsetRangeStop"></span>

### `ValkeyModule_ZsetRangeStop`

    void ValkeyModule_ZsetRangeStop(ValkeyModuleKey *key);

**Available since:** 4.0.0

Stop a sorted set iteration.

<span id="ValkeyModule_ZsetRangeEndReached"></span>

### `ValkeyModule_ZsetRangeEndReached`

    int ValkeyModule_ZsetRangeEndReached(ValkeyModuleKey *key);

**Available since:** 4.0.0

Return the "End of range" flag value to signal the end of the iteration.

<span id="ValkeyModule_ZsetFirstInScoreRange"></span>

### `ValkeyModule_ZsetFirstInScoreRange`

    int ValkeyModule_ZsetFirstInScoreRange(ValkeyModuleKey *key,
                                           double min,
                                           double max,
                                           int minex,
                                           int maxex);

**Available since:** 4.0.0

Setup a sorted set iterator seeking the first element in the specified
range. Returns `VALKEYMODULE_OK` if the iterator was correctly initialized
otherwise `VALKEYMODULE_ERR` is returned in the following conditions:

1. The value stored at key is not a sorted set or the key is empty.

The range is specified according to the two double values 'min' and 'max'.
Both can be infinite using the following two macros:

* `VALKEYMODULE_POSITIVE_INFINITE` for positive infinite value
* `VALKEYMODULE_NEGATIVE_INFINITE` for negative infinite value

'minex' and 'maxex' parameters, if true, respectively setup a range
where the min and max value are exclusive (not included) instead of
inclusive.

<span id="ValkeyModule_ZsetLastInScoreRange"></span>

### `ValkeyModule_ZsetLastInScoreRange`

    int ValkeyModule_ZsetLastInScoreRange(ValkeyModuleKey *key,
                                          double min,
                                          double max,
                                          int minex,
                                          int maxex);

**Available since:** 4.0.0

Exactly like [`ValkeyModule_ZsetFirstInScoreRange()`](#ValkeyModule_ZsetFirstInScoreRange) but the last element of
the range is selected for the start of the iteration instead.

<span id="ValkeyModule_ZsetFirstInLexRange"></span>

### `ValkeyModule_ZsetFirstInLexRange`

    int ValkeyModule_ZsetFirstInLexRange(ValkeyModuleKey *key,
                                         ValkeyModuleString *min,
                                         ValkeyModuleString *max);

**Available since:** 4.0.0

Setup a sorted set iterator seeking the first element in the specified
lexicographical range. Returns `VALKEYMODULE_OK` if the iterator was correctly
initialized otherwise `VALKEYMODULE_ERR` is returned in the
following conditions:

1. The value stored at key is not a sorted set or the key is empty.
2. The lexicographical range 'min' and 'max' format is invalid.

'min' and 'max' should be provided as two `ValkeyModuleString` objects
in the same format as the parameters passed to the ZRANGEBYLEX command.
The function does not take ownership of the objects, so they can be released
ASAP after the iterator is setup.

<span id="ValkeyModule_ZsetLastInLexRange"></span>

### `ValkeyModule_ZsetLastInLexRange`

    int ValkeyModule_ZsetLastInLexRange(ValkeyModuleKey *key,
                                        ValkeyModuleString *min,
                                        ValkeyModuleString *max);

**Available since:** 4.0.0

Exactly like [`ValkeyModule_ZsetFirstInLexRange()`](#ValkeyModule_ZsetFirstInLexRange) but the last element of
the range is selected for the start of the iteration instead.

<span id="ValkeyModule_ZsetRangeCurrentElement"></span>

### `ValkeyModule_ZsetRangeCurrentElement`

    ValkeyModuleString *ValkeyModule_ZsetRangeCurrentElement(ValkeyModuleKey *key,
                                                             double *score);

**Available since:** 4.0.0

Return the current sorted set element of an active sorted set iterator
or NULL if the range specified in the iterator does not include any
element.

<span id="ValkeyModule_ZsetRangeNext"></span>

### `ValkeyModule_ZsetRangeNext`

    int ValkeyModule_ZsetRangeNext(ValkeyModuleKey *key);

**Available since:** 4.0.0

Go to the next element of the sorted set iterator. Returns 1 if there was
a next element, 0 if we are already at the latest element or the range
does not include any item at all.

<span id="ValkeyModule_ZsetRangePrev"></span>

### `ValkeyModule_ZsetRangePrev`

    int ValkeyModule_ZsetRangePrev(ValkeyModuleKey *key);

**Available since:** 4.0.0

Go to the previous element of the sorted set iterator. Returns 1 if there was
a previous element, 0 if we are already at the first element or the range
does not include any item at all.

<span id="section-key-api-for-hash-type"></span>

## Key API for Hash type

See also [`ValkeyModule_ValueLength()`](#ValkeyModule_ValueLength), which returns the number of fields in a hash.

<span id="ValkeyModule_HashSet"></span>

### `ValkeyModule_HashSet`

    int ValkeyModule_HashSet(ValkeyModuleKey *key, int flags, ...);

**Available since:** 4.0.0

Set the field of the specified hash field to the specified value.
If the key is an empty key open for writing, it is created with an empty
hash value, in order to set the specified field.

The function is variadic and the user must specify pairs of field
names and values, both as `ValkeyModuleString` pointers (unless the
CFIELD option is set, see later). At the end of the field/value-ptr pairs,
NULL must be specified as last argument to signal the end of the arguments
in the variadic function.

Example to set the hash argv[1] to the value argv[2]:

     ValkeyModule_HashSet(key,VALKEYMODULE_HASH_NONE,argv[1],argv[2],NULL);

The function can also be used in order to delete fields (if they exist)
by setting them to the specified value of `VALKEYMODULE_HASH_DELETE`:

     ValkeyModule_HashSet(key,VALKEYMODULE_HASH_NONE,argv[1],
                         VALKEYMODULE_HASH_DELETE,NULL);

The behavior of the command changes with the specified flags, that can be
set to `VALKEYMODULE_HASH_NONE` if no special behavior is needed.

    VALKEYMODULE_HASH_NX: The operation is performed only if the field was not
                         already existing in the hash.
    VALKEYMODULE_HASH_XX: The operation is performed only if the field was
                         already existing, so that a new value could be
                         associated to an existing filed, but no new fields
                         are created.
    VALKEYMODULE_HASH_CFIELDS: The field names passed are null terminated C
                              strings instead of ValkeyModuleString objects.
    VALKEYMODULE_HASH_COUNT_ALL: Include the number of inserted fields in the
                                returned number, in addition to the number of
                                updated and deleted fields. (Added in Redis OSS
                                6.2.)

Unless NX is specified, the command overwrites the old field value with
the new one.

When using `VALKEYMODULE_HASH_CFIELDS`, field names are reported using
normal C strings, so for example to delete the field "foo" the following
code can be used:

     ValkeyModule_HashSet(key,VALKEYMODULE_HASH_CFIELDS,"foo",
                         VALKEYMODULE_HASH_DELETE,NULL);

Return value:

The number of fields existing in the hash prior to the call, which have been
updated (its old value has been replaced by a new value) or deleted. If the
flag `VALKEYMODULE_HASH_COUNT_ALL` is set, inserted fields not previously
existing in the hash are also counted.

If the return value is zero, `errno` is set (since Redis OSS 6.2) as follows:

- EINVAL if any unknown flags are set or if key is NULL.
- ENOTSUP if the key is associated with a non Hash value.
- EBADF if the key was not opened for writing.
- ENOENT if no fields were counted as described under Return value above.
  This is not actually an error. The return value can be zero if all fields
  were just created and the `COUNT_ALL` flag was unset, or if changes were held
  back due to the NX and XX flags.

NOTICE: The return value semantics of this function are very different
between Redis OSS 6.2 and older versions. Modules that use it should determine
the server version and handle it accordingly.

<span id="ValkeyModule_HashGet"></span>

### `ValkeyModule_HashGet`

    int ValkeyModule_HashGet(ValkeyModuleKey *key, int flags, ...);

**Available since:** 4.0.0

Get fields from a hash value. This function is called using a variable
number of arguments, alternating a field name (as a `ValkeyModuleString`
pointer) with a pointer to a `ValkeyModuleString` pointer, that is set to the
value of the field if the field exists, or NULL if the field does not exist.
At the end of the field/value-ptr pairs, NULL must be specified as last
argument to signal the end of the arguments in the variadic function.

This is an example usage:

     ValkeyModuleString *first, *second;
     ValkeyModule_HashGet(mykey,VALKEYMODULE_HASH_NONE,argv[1],&first,
                         argv[2],&second,NULL);

As with [`ValkeyModule_HashSet()`](#ValkeyModule_HashSet) the behavior of the command can be specified
passing flags different than `VALKEYMODULE_HASH_NONE`:

`VALKEYMODULE_HASH_CFIELDS`: field names as null terminated C strings.

`VALKEYMODULE_HASH_EXISTS`: instead of setting the value of the field
expecting a `ValkeyModuleString` pointer to pointer, the function just
reports if the field exists or not and expects an integer pointer
as the second element of each pair.

Example of `VALKEYMODULE_HASH_CFIELDS`:

     ValkeyModuleString *username, *hashedpass;
     ValkeyModule_HashGet(mykey,VALKEYMODULE_HASH_CFIELDS,"username",&username,"hp",&hashedpass, NULL);

Example of `VALKEYMODULE_HASH_EXISTS`:

     int exists;
     ValkeyModule_HashGet(mykey,VALKEYMODULE_HASH_EXISTS,argv[1],&exists,NULL);

The function returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` if
the key is not a hash value.

Memory management:

The returned `ValkeyModuleString` objects should be released with
[`ValkeyModule_FreeString()`](#ValkeyModule_FreeString), or by enabling automatic memory management.

<span id="section-key-api-for-stream-type"></span>

## Key API for Stream type

For an introduction to streams, see [https://valkey.io/topics/streams-intro](https://valkey.io/topics/streams-intro).

The type `ValkeyModuleStreamID`, which is used in stream functions, is a struct
with two 64-bit fields and is defined as

    typedef struct ValkeyModuleStreamID {
        uint64_t ms;
        uint64_t seq;
    } ValkeyModuleStreamID;

See also [`ValkeyModule_ValueLength()`](#ValkeyModule_ValueLength), which returns the length of a stream, and the
conversion functions [`ValkeyModule_StringToStreamID()`](#ValkeyModule_StringToStreamID) and [`ValkeyModule_CreateStringFromStreamID()`](#ValkeyModule_CreateStringFromStreamID).

<span id="ValkeyModule_StreamAdd"></span>

### `ValkeyModule_StreamAdd`

    int ValkeyModule_StreamAdd(ValkeyModuleKey *key,
                               int flags,
                               ValkeyModuleStreamID *id,
                               ValkeyModuleString **argv,
                               long numfields);

**Available since:** 6.2.0

Adds an entry to a stream. Like XADD without trimming.

- `key`: The key where the stream is (or will be) stored
- `flags`: A bit field of
  - `VALKEYMODULE_STREAM_ADD_AUTOID`: Assign a stream ID automatically, like
    `*` in the XADD command.
- `id`: If the `AUTOID` flag is set, this is where the assigned ID is
  returned. Can be NULL if `AUTOID` is set, if you don't care to receive the
  ID. If `AUTOID` is not set, this is the requested ID.
- `argv`: A pointer to an array of size `numfields * 2` containing the
  fields and values.
- `numfields`: The number of field-value pairs in `argv`.

Returns `VALKEYMODULE_OK` if an entry has been added. On failure,
`VALKEYMODULE_ERR` is returned and `errno` is set as follows:

- EINVAL if called with invalid arguments
- ENOTSUP if the key refers to a value of a type other than stream
- EBADF if the key was not opened for writing
- EDOM if the given ID was 0-0 or not greater than all other IDs in the
  stream (only if the AUTOID flag is unset)
- EFBIG if the stream has reached the last possible ID
- ERANGE if the elements are too large to be stored.

<span id="ValkeyModule_StreamDelete"></span>

### `ValkeyModule_StreamDelete`

    int ValkeyModule_StreamDelete(ValkeyModuleKey *key, ValkeyModuleStreamID *id);

**Available since:** 6.2.0

Deletes an entry from a stream.

- `key`: A key opened for writing, with no stream iterator started.
- `id`: The stream ID of the entry to delete.

Returns `VALKEYMODULE_OK` on success. On failure, `VALKEYMODULE_ERR` is returned
and `errno` is set as follows:

- EINVAL if called with invalid arguments
- ENOTSUP if the key refers to a value of a type other than stream or if the
  key is empty
- EBADF if the key was not opened for writing or if a stream iterator is
  associated with the key
- ENOENT if no entry with the given stream ID exists

See also [`ValkeyModule_StreamIteratorDelete()`](#ValkeyModule_StreamIteratorDelete) for deleting the current entry while
iterating using a stream iterator.

<span id="ValkeyModule_StreamIteratorStart"></span>

### `ValkeyModule_StreamIteratorStart`

    int ValkeyModule_StreamIteratorStart(ValkeyModuleKey *key,
                                         int flags,
                                         ValkeyModuleStreamID *start,
                                         ValkeyModuleStreamID *end);

**Available since:** 6.2.0

Sets up a stream iterator.

- `key`: The stream key opened for reading using [`ValkeyModule_OpenKey()`](#ValkeyModule_OpenKey).
- `flags`:
  - `VALKEYMODULE_STREAM_ITERATOR_EXCLUSIVE`: Don't include `start` and `end`
    in the iterated range.
  - `VALKEYMODULE_STREAM_ITERATOR_REVERSE`: Iterate in reverse order, starting
    from the `end` of the range.
- `start`: The lower bound of the range. Use NULL for the beginning of the
  stream.
- `end`: The upper bound of the range. Use NULL for the end of the stream.

Returns `VALKEYMODULE_OK` on success. On failure, `VALKEYMODULE_ERR` is returned
and `errno` is set as follows:

- EINVAL if called with invalid arguments
- ENOTSUP if the key refers to a value of a type other than stream or if the
  key is empty
- EBADF if the key was not opened for writing or if a stream iterator is
  already associated with the key
- EDOM if `start` or `end` is outside the valid range

Returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` if the key doesn't
refer to a stream or if invalid arguments were given.

The stream IDs are retrieved using [`ValkeyModule_StreamIteratorNextID()`](#ValkeyModule_StreamIteratorNextID) and
for each stream ID, the fields and values are retrieved using
[`ValkeyModule_StreamIteratorNextField()`](#ValkeyModule_StreamIteratorNextField). The iterator is freed by calling
[`ValkeyModule_StreamIteratorStop()`](#ValkeyModule_StreamIteratorStop).

Example (error handling omitted):

    ValkeyModule_StreamIteratorStart(key, 0, startid_ptr, endid_ptr);
    ValkeyModuleStreamID id;
    long numfields;
    while (ValkeyModule_StreamIteratorNextID(key, &id, &numfields) ==
           VALKEYMODULE_OK) {
        ValkeyModuleString *field, *value;
        while (ValkeyModule_StreamIteratorNextField(key, &field, &value) ==
               VALKEYMODULE_OK) {
            //
            // ... Do stuff ...
            //
            ValkeyModule_FreeString(ctx, field);
            ValkeyModule_FreeString(ctx, value);
        }
    }
    ValkeyModule_StreamIteratorStop(key);

<span id="ValkeyModule_StreamIteratorStop"></span>

### `ValkeyModule_StreamIteratorStop`

    int ValkeyModule_StreamIteratorStop(ValkeyModuleKey *key);

**Available since:** 6.2.0

Stops a stream iterator created using [`ValkeyModule_StreamIteratorStart()`](#ValkeyModule_StreamIteratorStart) and
reclaims its memory.

Returns `VALKEYMODULE_OK` on success. On failure, `VALKEYMODULE_ERR` is returned
and `errno` is set as follows:

- EINVAL if called with a NULL key
- ENOTSUP if the key refers to a value of a type other than stream or if the
  key is empty
- EBADF if the key was not opened for writing or if no stream iterator is
  associated with the key

<span id="ValkeyModule_StreamIteratorNextID"></span>

### `ValkeyModule_StreamIteratorNextID`

    int ValkeyModule_StreamIteratorNextID(ValkeyModuleKey *key,
                                          ValkeyModuleStreamID *id,
                                          long *numfields);

**Available since:** 6.2.0

Finds the next stream entry and returns its stream ID and the number of
fields.

- `key`: Key for which a stream iterator has been started using
  [`ValkeyModule_StreamIteratorStart()`](#ValkeyModule_StreamIteratorStart).
- `id`: The stream ID returned. NULL if you don't care.
- `numfields`: The number of fields in the found stream entry. NULL if you
  don't care.

Returns `VALKEYMODULE_OK` and sets `*id` and `*numfields` if an entry was found.
On failure, `VALKEYMODULE_ERR` is returned and `errno` is set as follows:

- EINVAL if called with a NULL key
- ENOTSUP if the key refers to a value of a type other than stream or if the
  key is empty
- EBADF if no stream iterator is associated with the key
- ENOENT if there are no more entries in the range of the iterator

In practice, if [`ValkeyModule_StreamIteratorNextID()`](#ValkeyModule_StreamIteratorNextID) is called after a successful call
to [`ValkeyModule_StreamIteratorStart()`](#ValkeyModule_StreamIteratorStart) and with the same key, it is safe to assume that
an `VALKEYMODULE_ERR` return value means that there are no more entries.

Use [`ValkeyModule_StreamIteratorNextField()`](#ValkeyModule_StreamIteratorNextField) to retrieve the fields and values.
See the example at [`ValkeyModule_StreamIteratorStart()`](#ValkeyModule_StreamIteratorStart).

<span id="ValkeyModule_StreamIteratorNextField"></span>

### `ValkeyModule_StreamIteratorNextField`

    int ValkeyModule_StreamIteratorNextField(ValkeyModuleKey *key,
                                             ValkeyModuleString **field_ptr,
                                             ValkeyModuleString **value_ptr);

**Available since:** 6.2.0

Retrieves the next field of the current stream ID and its corresponding value
in a stream iteration. This function should be called repeatedly after calling
[`ValkeyModule_StreamIteratorNextID()`](#ValkeyModule_StreamIteratorNextID) to fetch each field-value pair.

- `key`: Key where a stream iterator has been started.
- `field_ptr`: This is where the field is returned.
- `value_ptr`: This is where the value is returned.

Returns `VALKEYMODULE_OK` and points `*field_ptr` and `*value_ptr` to freshly
allocated `ValkeyModuleString` objects. The string objects are freed
automatically when the callback finishes if automatic memory is enabled. On
failure, `VALKEYMODULE_ERR` is returned and `errno` is set as follows:

- EINVAL if called with a NULL key
- ENOTSUP if the key refers to a value of a type other than stream or if the
  key is empty
- EBADF if no stream iterator is associated with the key
- ENOENT if there are no more fields in the current stream entry

In practice, if [`ValkeyModule_StreamIteratorNextField()`](#ValkeyModule_StreamIteratorNextField) is called after a successful
call to [`ValkeyModule_StreamIteratorNextID()`](#ValkeyModule_StreamIteratorNextID) and with the same key, it is safe to assume
that an `VALKEYMODULE_ERR` return value means that there are no more fields.

See the example at [`ValkeyModule_StreamIteratorStart()`](#ValkeyModule_StreamIteratorStart).

<span id="ValkeyModule_StreamIteratorDelete"></span>

### `ValkeyModule_StreamIteratorDelete`

    int ValkeyModule_StreamIteratorDelete(ValkeyModuleKey *key);

**Available since:** 6.2.0

Deletes the current stream entry while iterating.

This function can be called after [`ValkeyModule_StreamIteratorNextID()`](#ValkeyModule_StreamIteratorNextID) or after any
calls to [`ValkeyModule_StreamIteratorNextField()`](#ValkeyModule_StreamIteratorNextField).

Returns `VALKEYMODULE_OK` on success. On failure, `VALKEYMODULE_ERR` is returned
and `errno` is set as follows:

- EINVAL if key is NULL
- ENOTSUP if the key is empty or is of another type than stream
- EBADF if the key is not opened for writing, if no iterator has been started
- ENOENT if the iterator has no current stream entry

<span id="ValkeyModule_StreamTrimByLength"></span>

### `ValkeyModule_StreamTrimByLength`

    long long ValkeyModule_StreamTrimByLength(ValkeyModuleKey *key,
                                              int flags,
                                              long long length);

**Available since:** 6.2.0

Trim a stream by length, similar to XTRIM with MAXLEN.

- `key`: Key opened for writing.
- `flags`: A bitfield of
  - `VALKEYMODULE_STREAM_TRIM_APPROX`: Trim less if it improves performance,
    like XTRIM with `~`.
- `length`: The number of stream entries to keep after trimming.

Returns the number of entries deleted. On failure, a negative value is
returned and `errno` is set as follows:

- EINVAL if called with invalid arguments
- ENOTSUP if the key is empty or of a type other than stream
- EBADF if the key is not opened for writing

<span id="ValkeyModule_StreamTrimByID"></span>

### `ValkeyModule_StreamTrimByID`

    long long ValkeyModule_StreamTrimByID(ValkeyModuleKey *key,
                                          int flags,
                                          ValkeyModuleStreamID *id);

**Available since:** 6.2.0

Trim a stream by ID, similar to XTRIM with MINID.

- `key`: Key opened for writing.
- `flags`: A bitfield of
  - `VALKEYMODULE_STREAM_TRIM_APPROX`: Trim less if it improves performance,
    like XTRIM with `~`.
- `id`: The smallest stream ID to keep after trimming.

Returns the number of entries deleted. On failure, a negative value is
returned and `errno` is set as follows:

- EINVAL if called with invalid arguments
- ENOTSUP if the key is empty or of a type other than stream
- EBADF if the key is not opened for writing

<span id="section-calling-commands-from-modules"></span>

## Calling commands from modules

[`ValkeyModule_Call()`](#ValkeyModule_Call) sends a command to the server. The remaining functions handle the reply.

<span id="ValkeyModule_FreeCallReply"></span>

### `ValkeyModule_FreeCallReply`

    void ValkeyModule_FreeCallReply(ValkeyModuleCallReply *reply);

**Available since:** 4.0.0

Free a Call reply and all the nested replies it contains if it's an
array.

<span id="ValkeyModule_CallReplyType"></span>

### `ValkeyModule_CallReplyType`

    int ValkeyModule_CallReplyType(ValkeyModuleCallReply *reply);

**Available since:** 4.0.0

Return the reply type as one of the following:

- `VALKEYMODULE_REPLY_UNKNOWN`
- `VALKEYMODULE_REPLY_STRING`
- `VALKEYMODULE_REPLY_ERROR`
- `VALKEYMODULE_REPLY_INTEGER`
- `VALKEYMODULE_REPLY_ARRAY`
- `VALKEYMODULE_REPLY_NULL`
- `VALKEYMODULE_REPLY_MAP`
- `VALKEYMODULE_REPLY_SET`
- `VALKEYMODULE_REPLY_BOOL`
- `VALKEYMODULE_REPLY_DOUBLE`
- `VALKEYMODULE_REPLY_BIG_NUMBER`
- `VALKEYMODULE_REPLY_VERBATIM_STRING`
- `VALKEYMODULE_REPLY_ATTRIBUTE`
- `VALKEYMODULE_REPLY_PROMISE`

<span id="ValkeyModule_CallReplyLength"></span>

### `ValkeyModule_CallReplyLength`

    size_t ValkeyModule_CallReplyLength(ValkeyModuleCallReply *reply);

**Available since:** 4.0.0

Return the reply type length, where applicable.

<span id="ValkeyModule_CallReplyArrayElement"></span>

### `ValkeyModule_CallReplyArrayElement`

    ValkeyModuleCallReply *ValkeyModule_CallReplyArrayElement(ValkeyModuleCallReply *reply,
                                                              size_t idx);

**Available since:** 4.0.0

Return the 'idx'-th nested call reply element of an array reply, or NULL
if the reply type is wrong or the index is out of range.

<span id="ValkeyModule_CallReplyInteger"></span>

### `ValkeyModule_CallReplyInteger`

    long long ValkeyModule_CallReplyInteger(ValkeyModuleCallReply *reply);

**Available since:** 4.0.0

Return the `long long` of an integer reply.

<span id="ValkeyModule_CallReplyDouble"></span>

### `ValkeyModule_CallReplyDouble`

    double ValkeyModule_CallReplyDouble(ValkeyModuleCallReply *reply);

**Available since:** 7.0.0

Return the double value of a double reply.

<span id="ValkeyModule_CallReplyBigNumber"></span>

### `ValkeyModule_CallReplyBigNumber`

    const char *ValkeyModule_CallReplyBigNumber(ValkeyModuleCallReply *reply,
                                                size_t *len);

**Available since:** 7.0.0

Return the big number value of a big number reply.

<span id="ValkeyModule_CallReplyVerbatim"></span>

### `ValkeyModule_CallReplyVerbatim`

    const char *ValkeyModule_CallReplyVerbatim(ValkeyModuleCallReply *reply,
                                               size_t *len,
                                               const char **format);

**Available since:** 7.0.0

Return the value of a verbatim string reply,
An optional output argument can be given to get verbatim reply format.

<span id="ValkeyModule_CallReplyBool"></span>

### `ValkeyModule_CallReplyBool`

    int ValkeyModule_CallReplyBool(ValkeyModuleCallReply *reply);

**Available since:** 7.0.0

Return the Boolean value of a Boolean reply.

<span id="ValkeyModule_CallReplySetElement"></span>

### `ValkeyModule_CallReplySetElement`

    ValkeyModuleCallReply *ValkeyModule_CallReplySetElement(ValkeyModuleCallReply *reply,
                                                            size_t idx);

**Available since:** 7.0.0

Return the 'idx'-th nested call reply element of a set reply, or NULL
if the reply type is wrong or the index is out of range.

<span id="ValkeyModule_CallReplyMapElement"></span>

### `ValkeyModule_CallReplyMapElement`

    int ValkeyModule_CallReplyMapElement(ValkeyModuleCallReply *reply,
                                         size_t idx,
                                         ValkeyModuleCallReply **key,
                                         ValkeyModuleCallReply **val);

**Available since:** 7.0.0

Retrieve the 'idx'-th key and value of a map reply.

Returns:
- `VALKEYMODULE_OK` on success.
- `VALKEYMODULE_ERR` if idx out of range or if the reply type is wrong.

The `key` and `value` arguments are used to return by reference, and may be
NULL if not required.

<span id="ValkeyModule_CallReplyAttribute"></span>

### `ValkeyModule_CallReplyAttribute`

    ValkeyModuleCallReply *ValkeyModule_CallReplyAttribute(ValkeyModuleCallReply *reply);

**Available since:** 7.0.0

Return the attribute of the given reply, or NULL if no attribute exists.

<span id="ValkeyModule_CallReplyAttributeElement"></span>

### `ValkeyModule_CallReplyAttributeElement`

    int ValkeyModule_CallReplyAttributeElement(ValkeyModuleCallReply *reply,
                                               size_t idx,
                                               ValkeyModuleCallReply **key,
                                               ValkeyModuleCallReply **val);

**Available since:** 7.0.0

Retrieve the 'idx'-th key and value of an attribute reply.

Returns:
- `VALKEYMODULE_OK` on success.
- `VALKEYMODULE_ERR` if idx out of range or if the reply type is wrong.

The `key` and `value` arguments are used to return by reference, and may be
NULL if not required.

<span id="ValkeyModule_CallReplyPromiseSetUnblockHandler"></span>

### `ValkeyModule_CallReplyPromiseSetUnblockHandler`

    void ValkeyModule_CallReplyPromiseSetUnblockHandler(ValkeyModuleCallReply *reply,
                                                        ValkeyModuleOnUnblocked on_unblock,
                                                        void *private_data);

**Available since:** 7.2.0

Set unblock handler (callback and private data) on the given promise `ValkeyModuleCallReply`.
The given reply must be of promise type (`VALKEYMODULE_REPLY_PROMISE`).

<span id="ValkeyModule_CallReplyPromiseAbort"></span>

### `ValkeyModule_CallReplyPromiseAbort`

    int ValkeyModule_CallReplyPromiseAbort(ValkeyModuleCallReply *reply,
                                           void **private_data);

**Available since:** 7.2.0

Abort the execution of a given promise `ValkeyModuleCallReply`.
return `REDMODULE_OK` in case the abort was done successfully and `VALKEYMODULE_ERR`
if its not possible to abort the execution (execution already finished).
In case the execution was aborted (`REDMODULE_OK` was returned), the `private_data` out parameter
will be set with the value of the private data that was given on '[`ValkeyModule_CallReplyPromiseSetUnblockHandler`](#ValkeyModule_CallReplyPromiseSetUnblockHandler)'
so the caller will be able to release the private data.

If the execution was aborted successfully, it is promised that the unblock handler will not be called.
That said, it is possible that the abort operation will successes but the operation will still continue.
This can happened if, for example, a module implements some blocking command and does not respect the
disconnect callback. For server-provided commands this can not happened.

<span id="ValkeyModule_CallReplyStringPtr"></span>

### `ValkeyModule_CallReplyStringPtr`

    const char *ValkeyModule_CallReplyStringPtr(ValkeyModuleCallReply *reply,
                                                size_t *len);

**Available since:** 4.0.0

Return the pointer and length of a string or error reply.

<span id="ValkeyModule_CreateStringFromCallReply"></span>

### `ValkeyModule_CreateStringFromCallReply`

    ValkeyModuleString *ValkeyModule_CreateStringFromCallReply(ValkeyModuleCallReply *reply);

**Available since:** 4.0.0

Return a new string object from a call reply of type string, error or
integer. Otherwise (wrong reply type) return NULL.

<span id="ValkeyModule_SetContextUser"></span>

### `ValkeyModule_SetContextUser`

    void ValkeyModule_SetContextUser(ValkeyModuleCtx *ctx,
                                     const ValkeyModuleUser *user);

**Available since:** 7.0.6

Modifies the user that [`ValkeyModule_Call`](#ValkeyModule_Call) will use (e.g. for ACL checks)

<span id="ValkeyModule_Call"></span>

### `ValkeyModule_Call`

    ValkeyModuleCallReply *ValkeyModule_Call(ValkeyModuleCtx *ctx,
                                             const char *cmdname,
                                             const char *fmt,
                                             ...);

**Available since:** 4.0.0

Exported API to call any command from modules.

* **cmdname**: The command to call.
* **fmt**: A format specifier string for the command's arguments. Each
  of the arguments should be specified by a valid type specification. The
  format specifier can also contain the modifiers `!`, `A`, `3` and `R` which
  don't have a corresponding argument.

    * `b` -- The argument is a buffer and is immediately followed by another
             argument that is the buffer's length.
    * `c` -- The argument is a pointer to a plain C string (null-terminated).
    * `l` -- The argument is a `long long` integer.
    * `s` -- The argument is a ValkeyModuleString.
    * `v` -- The argument(s) is a vector of ValkeyModuleString.
    * `!` -- Sends the command and its arguments to replicas and AOF.
    * `A` -- Suppress AOF propagation, send only to replicas (requires `!`).
    * `R` -- Suppress replicas propagation, send only to AOF (requires `!`).
    * `3` -- Return a RESP3 reply. This will change the command reply.
             e.g., HGETALL returns a map instead of a flat array.
    * `0` -- Return the reply in auto mode, i.e. the reply format will be the
             same as the client attached to the given ValkeyModuleCtx. This will
             probably used when you want to pass the reply directly to the client.
    * `C` -- Run a command as the user attached to the context.
             User is either attached automatically via the client that directly
             issued the command and created the context or via ValkeyModule_SetContextUser.
             If the context is not directly created by an issued command (such as a
             background context and no user was set on it via ValkeyModule_SetContextUser,
             ValkeyModule_Call will fail.
             Checks if the command can be executed according to ACL rules and causes
             the command to run as the determined user, so that any future user
             dependent activity, such as ACL checks within scripts will proceed as
             expected.
             Otherwise, the command will run as the unrestricted user.
    * `S` -- Run the command in a script mode, this means that it will raise
             an error if a command which are not allowed inside a script
             (flagged with the `deny-script` flag) is invoked (like SHUTDOWN).
             In addition, on script mode, write commands are not allowed if there are
             not enough good replicas (as configured with `min-replicas-to-write`)
             or when the server is unable to persist to the disk.
    * `W` -- Do not allow to run any write command (flagged with the `write` flag).
    * `M` -- Do not allow `deny-oom` flagged commands when over the memory limit.
    * `E` -- Return error as ValkeyModuleCallReply. If there is an error before
             invoking the command, the error is returned using errno mechanism.
             This flag allows to get the error also as an error CallReply with
             relevant error message.
    * 'D' -- A "Dry Run" mode. Return before executing the underlying call().
             If everything succeeded, it will return with a NULL, otherwise it will
             return with a CallReply object denoting the error, as if it was called with
             the 'E' code.
    * 'K' -- Allow running blocking commands. If enabled and the command gets blocked, a
             special VALKEYMODULE_REPLY_PROMISE will be returned. This reply type
             indicates that the command was blocked and the reply will be given asynchronously.
             The module can use this reply object to set a handler which will be called when
             the command gets unblocked using ValkeyModule_CallReplyPromiseSetUnblockHandler.
             The handler must be set immediately after the command invocation (without releasing
             the lock in between). If the handler is not set, the blocking command will
             still continue its execution but the reply will be ignored (fire and forget),
             notice that this is dangerous in case of role change, as explained below.
             The module can use ValkeyModule_CallReplyPromiseAbort to abort the command invocation
             if it was not yet finished (see ValkeyModule_CallReplyPromiseAbort documentation for more
             details). It is also the module's responsibility to abort the execution on role change, either by using
             server event (to get notified when the instance becomes a replica) or relying on the disconnect
             callback of the original client. Failing to do so can result in a write operation on a replica.
             Unlike other call replies, promise call reply **must** be freed while the GIL is locked.
             Notice that on unblocking, the only promise is that the unblock handler will be called,
             If the blocking ValkeyModule_Call caused the module to also block some real client (using ValkeyModule_BlockClient),
             it is the module responsibility to unblock this client on the unblock handler.
             On the unblock handler it is only allowed to perform the following:
             * Calling additional commands using ValkeyModule_Call
             * Open keys using ValkeyModule_OpenKey
             * Replicate data to the replica or AOF

             Specifically, it is not allowed to call any module API which are client related such as:
             * ValkeyModule_Reply* API's
             * ValkeyModule_BlockClient
             * ValkeyModule_GetCurrentUserName

* **...**: The actual arguments to the command.

On success a `ValkeyModuleCallReply` object is returned, otherwise
NULL is returned and errno is set to the following values:

* EBADF: wrong format specifier.
* EINVAL: wrong command arity.
* ENOENT: command does not exist.
* EPERM: operation in Cluster instance with key in non local slot.
* EROFS: operation in Cluster instance when a write command is sent
         in a readonly state.
* ENETDOWN: operation in Cluster instance when cluster is down.
* ENOTSUP: No ACL user for the specified module context
* EACCES: Command cannot be executed, according to ACL rules
* ENOSPC: Write or deny-oom command is not allowed
* ESPIPE: Command not allowed on script mode

Example code fragment:

     reply = ValkeyModule_Call(ctx,"INCRBY","sc",argv[1],"10");
     if (ValkeyModule_CallReplyType(reply) == VALKEYMODULE_REPLY_INTEGER) {
       long long myval = ValkeyModule_CallReplyInteger(reply);
       // Do something with myval.
     }

This API is documented here: [https://valkey.io/topics/modules-intro](https://valkey.io/topics/modules-intro)

<span id="ValkeyModule_CallReplyProto"></span>

### `ValkeyModule_CallReplyProto`

    const char *ValkeyModule_CallReplyProto(ValkeyModuleCallReply *reply,
                                            size_t *len);

**Available since:** 4.0.0

Return a pointer, and a length, to the protocol returned by the command
that returned the reply object.

<span id="section-modules-data-types"></span>

## Modules data types

When String DMA or using existing data structures is not enough, it is
possible to create new data types from scratch.
The module must provide a set of callbacks for handling the
new values exported (for example in order to provide RDB saving/loading,
AOF rewrite, and so forth). In this section we define this API.

<span id="ValkeyModule_CreateDataType"></span>

### `ValkeyModule_CreateDataType`

    moduleType *ValkeyModule_CreateDataType(ValkeyModuleCtx *ctx,
                                            const char *name,
                                            int encver,
                                            void *typemethods_ptr);

**Available since:** 4.0.0

Register a new data type exported by the module. The parameters are the
following. Please for in depth documentation check the modules API
documentation, especially [https://valkey.io/topics/modules-native-types](https://valkey.io/topics/modules-native-types).

* **name**: A 9 characters data type name that MUST be unique in the
  Modules ecosystem. Be creative... and there will be no collisions. Use
  the charset A-Z a-z 9-0, plus the two "-_" characters. A good
  idea is to use, for example `<typename>-<vendor>`. For example
  "tree-AntZ" may mean "Tree data structure by @antirez". To use both
  lower case and upper case letters helps in order to prevent collisions.
* **encver**: Encoding version, which is, the version of the serialization
  that a module used in order to persist data. As long as the "name"
  matches, the RDB loading will be dispatched to the type callbacks
  whatever 'encver' is used, however the module can understand if
  the encoding it must load are of an older version of the module.
  For example the module "tree-AntZ" initially used encver=0. Later
  after an upgrade, it started to serialize data in a different format
  and to register the type with encver=1. However this module may
  still load old data produced by an older version if the `rdb_load`
  callback is able to check the encver value and act accordingly.
  The encver must be a positive value between 0 and 1023.

* **typemethods_ptr** is a pointer to a `ValkeyModuleTypeMethods` structure
  that should be populated with the methods callbacks and structure
  version, like in the following example:

        ValkeyModuleTypeMethods tm = {
            .version = VALKEYMODULE_TYPE_METHOD_VERSION,
            .rdb_load = myType_RDBLoadCallBack,
            .rdb_save = myType_RDBSaveCallBack,
            .aof_rewrite = myType_AOFRewriteCallBack,
            .free = myType_FreeCallBack,

            // Optional fields
            .digest = myType_DigestCallBack,
            .mem_usage = myType_MemUsageCallBack,
            .aux_load = myType_AuxRDBLoadCallBack,
            .aux_save = myType_AuxRDBSaveCallBack,
            .free_effort = myType_FreeEffortCallBack,
            .unlink = myType_UnlinkCallBack,
            .copy = myType_CopyCallback,
            .defrag = myType_DefragCallback

            // Enhanced optional fields
            .mem_usage2 = myType_MemUsageCallBack2,
            .free_effort2 = myType_FreeEffortCallBack2,
            .unlink2 = myType_UnlinkCallBack2,
            .copy2 = myType_CopyCallback2,
        }

* **rdb_load**: A callback function pointer that loads data from RDB files.
* **rdb_save**: A callback function pointer that saves data to RDB files.
* **aof_rewrite**: A callback function pointer that rewrites data as commands.
* **digest**: A callback function pointer that is used for `DEBUG DIGEST`.
* **free**: A callback function pointer that can free a type value.
* **aux_save**: A callback function pointer that saves out of keyspace data to RDB files.
  'when' argument is either `VALKEYMODULE_AUX_BEFORE_RDB` or `VALKEYMODULE_AUX_AFTER_RDB`.
* **aux_load**: A callback function pointer that loads out of keyspace data from RDB files.
  Similar to `aux_save`, returns `VALKEYMODULE_OK` on success, and ERR otherwise.
* **free_effort**: A callback function pointer that used to determine whether the module's
  memory needs to be lazy reclaimed. The module should return the complexity involved by
  freeing the value. for example: how many pointers are gonna be freed. Note that if it
  returns 0, we'll always do an async free.
* **unlink**: A callback function pointer that used to notifies the module that the key has
  been removed from the DB by the server, and may soon be freed by a background thread. Note that
  it won't be called on FLUSHALL/FLUSHDB (both sync and async), and the module can use the
  `ValkeyModuleEvent_FlushDB` to hook into that.
* **copy**: A callback function pointer that is used to make a copy of the specified key.
  The module is expected to perform a deep copy of the specified value and return it.
  In addition, hints about the names of the source and destination keys is provided.
  A NULL return value is considered an error and the copy operation fails.
  Note: if the target key exists and is being overwritten, the copy callback will be
  called first, followed by a free callback to the value that is being replaced.

* **defrag**: A callback function pointer that is used to request the module to defrag
  a key. The module should then iterate pointers and call the relevant `ValkeyModule_Defrag*()`
  functions to defragment pointers or complex types. The module should continue
  iterating as long as [`ValkeyModule_DefragShouldStop()`](#ValkeyModule_DefragShouldStop) returns a zero value, and return a
  zero value if finished or non-zero value if more work is left to be done. If more work
  needs to be done, [`ValkeyModule_DefragCursorSet()`](#ValkeyModule_DefragCursorSet) and [`ValkeyModule_DefragCursorGet()`](#ValkeyModule_DefragCursorGet) can be used to track
  this work across different calls.
  Normally, the defrag mechanism invokes the callback without a time limit, so
  [`ValkeyModule_DefragShouldStop()`](#ValkeyModule_DefragShouldStop) always returns zero. The "late defrag" mechanism which has
  a time limit and provides cursor support is used only for keys that are determined
  to have significant internal complexity. To determine this, the defrag mechanism
  uses the `free_effort` callback and the 'active-defrag-max-scan-fields' config directive.
  NOTE: The value is passed as a `void**` and the function is expected to update the
  pointer if the top-level value pointer is defragmented and consequently changes.

* **mem_usage2**: Similar to `mem_usage`, but provides the `ValkeyModuleKeyOptCtx` parameter
  so that meta information such as key name and db id can be obtained, and
  the `sample_size` for size estimation (see MEMORY USAGE command).
* **free_effort2**: Similar to `free_effort`, but provides the `ValkeyModuleKeyOptCtx` parameter
  so that meta information such as key name and db id can be obtained.
* **unlink2**: Similar to `unlink`, but provides the `ValkeyModuleKeyOptCtx` parameter
  so that meta information such as key name and db id can be obtained.
* **copy2**: Similar to `copy`, but provides the `ValkeyModuleKeyOptCtx` parameter
  so that meta information such as key names and db ids can be obtained.
* **aux_save2**: Similar to `aux_save`, but with small semantic change, if the module
  saves nothing on this callback then no data about this aux field will be written to the
  RDB and it will be possible to load the RDB even if the module is not loaded.

Note: the module name "AAAAAAAAA" is reserved and produces an error, it
happens to be pretty lame as well.

If [`ValkeyModule_CreateDataType()`](#ValkeyModule_CreateDataType) is called outside of `ValkeyModule_OnLoad()` function,
there is already a module registering a type with the same name,
or if the module name or encver is invalid, NULL is returned.
Otherwise the new type is registered into the server, and a reference of
type `ValkeyModuleType` is returned: the caller of the function should store
this reference into a global variable to make future use of it in the
modules type API, since a single module may register multiple types.
Example code fragment:

     static ValkeyModuleType *BalancedTreeType;

     int ValkeyModule_OnLoad(ValkeyModuleCtx *ctx) {
         // some code here ...
         BalancedTreeType = ValkeyModule_CreateDataType(...);
     }

<span id="ValkeyModule_ModuleTypeSetValue"></span>

### `ValkeyModule_ModuleTypeSetValue`

    int ValkeyModule_ModuleTypeSetValue(ValkeyModuleKey *key,
                                        moduleType *mt,
                                        void *value);

**Available since:** 4.0.0

If the key is open for writing, set the specified module type object
as the value of the key, deleting the old value if any.
On success `VALKEYMODULE_OK` is returned. If the key is not open for
writing or there is an active iterator, `VALKEYMODULE_ERR` is returned.

<span id="ValkeyModule_ModuleTypeGetType"></span>

### `ValkeyModule_ModuleTypeGetType`

    moduleType *ValkeyModule_ModuleTypeGetType(ValkeyModuleKey *key);

**Available since:** 4.0.0

Assuming [`ValkeyModule_KeyType()`](#ValkeyModule_KeyType) returned `VALKEYMODULE_KEYTYPE_MODULE` on
the key, returns the module type pointer of the value stored at key.

If the key is NULL, is not associated with a module type, or is empty,
then NULL is returned instead.

<span id="ValkeyModule_ModuleTypeGetValue"></span>

### `ValkeyModule_ModuleTypeGetValue`

    void *ValkeyModule_ModuleTypeGetValue(ValkeyModuleKey *key);

**Available since:** 4.0.0

Assuming [`ValkeyModule_KeyType()`](#ValkeyModule_KeyType) returned `VALKEYMODULE_KEYTYPE_MODULE` on
the key, returns the module type low-level value stored at key, as
it was set by the user via [`ValkeyModule_ModuleTypeSetValue()`](#ValkeyModule_ModuleTypeSetValue).

If the key is NULL, is not associated with a module type, or is empty,
then NULL is returned instead.

<span id="section-rdb-loading-and-saving-functions"></span>

## RDB loading and saving functions

<span id="ValkeyModule_IsIOError"></span>

### `ValkeyModule_IsIOError`

    int ValkeyModule_IsIOError(ValkeyModuleIO *io);

**Available since:** 6.0.0

Returns true if any previous IO API failed.
for `Load*` APIs the `VALKEYMODULE_OPTIONS_HANDLE_IO_ERRORS` flag must be set with
[`ValkeyModule_SetModuleOptions`](#ValkeyModule_SetModuleOptions) first.

<span id="ValkeyModule_SaveUnsigned"></span>

### `ValkeyModule_SaveUnsigned`

    void ValkeyModule_SaveUnsigned(ValkeyModuleIO *io, uint64_t value);

**Available since:** 4.0.0

Save an unsigned 64 bit value into the RDB file. This function should only
be called in the context of the `rdb_save` method of modules implementing new
data types.

<span id="ValkeyModule_LoadUnsigned"></span>

### `ValkeyModule_LoadUnsigned`

    uint64_t ValkeyModule_LoadUnsigned(ValkeyModuleIO *io);

**Available since:** 4.0.0

Load an unsigned 64 bit value from the RDB file. This function should only
be called in the context of the `rdb_load` method of modules implementing
new data types.

<span id="ValkeyModule_SaveSigned"></span>

### `ValkeyModule_SaveSigned`

    void ValkeyModule_SaveSigned(ValkeyModuleIO *io, int64_t value);

**Available since:** 4.0.0

Like [`ValkeyModule_SaveUnsigned()`](#ValkeyModule_SaveUnsigned) but for signed 64 bit values.

<span id="ValkeyModule_LoadSigned"></span>

### `ValkeyModule_LoadSigned`

    int64_t ValkeyModule_LoadSigned(ValkeyModuleIO *io);

**Available since:** 4.0.0

Like [`ValkeyModule_LoadUnsigned()`](#ValkeyModule_LoadUnsigned) but for signed 64 bit values.

<span id="ValkeyModule_SaveString"></span>

### `ValkeyModule_SaveString`

    void ValkeyModule_SaveString(ValkeyModuleIO *io, ValkeyModuleString *s);

**Available since:** 4.0.0

In the context of the `rdb_save` method of a module type, saves a
string into the RDB file taking as input a `ValkeyModuleString`.

The string can be later loaded with [`ValkeyModule_LoadString()`](#ValkeyModule_LoadString) or
other Load family functions expecting a serialized string inside
the RDB file.

<span id="ValkeyModule_SaveStringBuffer"></span>

### `ValkeyModule_SaveStringBuffer`

    void ValkeyModule_SaveStringBuffer(ValkeyModuleIO *io,
                                       const char *str,
                                       size_t len);

**Available since:** 4.0.0

Like [`ValkeyModule_SaveString()`](#ValkeyModule_SaveString) but takes a raw C pointer and length
as input.

<span id="ValkeyModule_LoadString"></span>

### `ValkeyModule_LoadString`

    ValkeyModuleString *ValkeyModule_LoadString(ValkeyModuleIO *io);

**Available since:** 4.0.0

In the context of the `rdb_load` method of a module data type, loads a string
from the RDB file, that was previously saved with [`ValkeyModule_SaveString()`](#ValkeyModule_SaveString)
functions family.

The returned string is a newly allocated `ValkeyModuleString` object, and
the user should at some point free it with a call to [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString).

If the data structure does not store strings as `ValkeyModuleString` objects,
the similar function [`ValkeyModule_LoadStringBuffer()`](#ValkeyModule_LoadStringBuffer) could be used instead.

<span id="ValkeyModule_LoadStringBuffer"></span>

### `ValkeyModule_LoadStringBuffer`

    char *ValkeyModule_LoadStringBuffer(ValkeyModuleIO *io, size_t *lenptr);

**Available since:** 4.0.0

Like [`ValkeyModule_LoadString()`](#ValkeyModule_LoadString) but returns a heap allocated string that
was allocated with [`ValkeyModule_Alloc()`](#ValkeyModule_Alloc), and can be resized or freed with
[`ValkeyModule_Realloc()`](#ValkeyModule_Realloc) or [`ValkeyModule_Free()`](#ValkeyModule_Free).

The size of the string is stored at '*lenptr' if not NULL.
The returned string is not automatically NULL terminated, it is loaded
exactly as it was stored inside the RDB file.

<span id="ValkeyModule_SaveDouble"></span>

### `ValkeyModule_SaveDouble`

    void ValkeyModule_SaveDouble(ValkeyModuleIO *io, double value);

**Available since:** 4.0.0

In the context of the `rdb_save` method of a module data type, saves a double
value to the RDB file. The double can be a valid number, a NaN or infinity.
It is possible to load back the value with [`ValkeyModule_LoadDouble()`](#ValkeyModule_LoadDouble).

<span id="ValkeyModule_LoadDouble"></span>

### `ValkeyModule_LoadDouble`

    double ValkeyModule_LoadDouble(ValkeyModuleIO *io);

**Available since:** 4.0.0

In the context of the `rdb_save` method of a module data type, loads back the
double value saved by [`ValkeyModule_SaveDouble()`](#ValkeyModule_SaveDouble).

<span id="ValkeyModule_SaveFloat"></span>

### `ValkeyModule_SaveFloat`

    void ValkeyModule_SaveFloat(ValkeyModuleIO *io, float value);

**Available since:** 4.0.0

In the context of the `rdb_save` method of a module data type, saves a float
value to the RDB file. The float can be a valid number, a NaN or infinity.
It is possible to load back the value with [`ValkeyModule_LoadFloat()`](#ValkeyModule_LoadFloat).

<span id="ValkeyModule_LoadFloat"></span>

### `ValkeyModule_LoadFloat`

    float ValkeyModule_LoadFloat(ValkeyModuleIO *io);

**Available since:** 4.0.0

In the context of the `rdb_save` method of a module data type, loads back the
float value saved by [`ValkeyModule_SaveFloat()`](#ValkeyModule_SaveFloat).

<span id="ValkeyModule_SaveLongDouble"></span>

### `ValkeyModule_SaveLongDouble`

    void ValkeyModule_SaveLongDouble(ValkeyModuleIO *io, long double value);

**Available since:** 6.0.0

In the context of the `rdb_save` method of a module data type, saves a long double
value to the RDB file. The double can be a valid number, a NaN or infinity.
It is possible to load back the value with [`ValkeyModule_LoadLongDouble()`](#ValkeyModule_LoadLongDouble).

<span id="ValkeyModule_LoadLongDouble"></span>

### `ValkeyModule_LoadLongDouble`

    long double ValkeyModule_LoadLongDouble(ValkeyModuleIO *io);

**Available since:** 6.0.0

In the context of the `rdb_save` method of a module data type, loads back the
long double value saved by [`ValkeyModule_SaveLongDouble()`](#ValkeyModule_SaveLongDouble).

<span id="section-key-digest-api-debug-digest-interface-for-modules-types"></span>

## Key digest API (DEBUG DIGEST interface for modules types)

<span id="ValkeyModule_DigestAddStringBuffer"></span>

### `ValkeyModule_DigestAddStringBuffer`

    void ValkeyModule_DigestAddStringBuffer(ValkeyModuleDigest *md,
                                            const char *ele,
                                            size_t len);

**Available since:** 4.0.0

Add a new element to the digest. This function can be called multiple times
one element after the other, for all the elements that constitute a given
data structure. The function call must be followed by the call to
[`ValkeyModule_DigestEndSequence`](#ValkeyModule_DigestEndSequence) eventually, when all the elements that are
always in a given order are added. See the Modules data types
documentation for more info. However this is a quick example that uses the
Set, Hash and List data types as an example.

To add a sequence of unordered elements (for example in the case of a
Set), the pattern to use is:

    foreach element {
        AddElement(element);
        EndSequence();
    }

Because Sets are not ordered, so every element added has a position that
does not depend from the other. However if instead our elements are
ordered in pairs, like field-value pairs of a Hash, then one should
use:

    foreach key,value {
        AddElement(key);
        AddElement(value);
        EndSequence();
    }

Because the key and value will be always in the above order, while instead
the single key-value pairs, can appear in any position into a hash.

A list of ordered elements would be implemented with:

    foreach element {
        AddElement(element);
    }
    EndSequence();

<span id="ValkeyModule_DigestAddLongLong"></span>

### `ValkeyModule_DigestAddLongLong`

    void ValkeyModule_DigestAddLongLong(ValkeyModuleDigest *md, long long ll);

**Available since:** 4.0.0

Like [`ValkeyModule_DigestAddStringBuffer()`](#ValkeyModule_DigestAddStringBuffer) but takes a `long long` as input
that gets converted into a string before adding it to the digest.

<span id="ValkeyModule_DigestEndSequence"></span>

### `ValkeyModule_DigestEndSequence`

    void ValkeyModule_DigestEndSequence(ValkeyModuleDigest *md);

**Available since:** 4.0.0

See the documentation for `ValkeyModule_DigestAddElement()`.

<span id="ValkeyModule_LoadDataTypeFromStringEncver"></span>

### `ValkeyModule_LoadDataTypeFromStringEncver`

    void *ValkeyModule_LoadDataTypeFromStringEncver(const ValkeyModuleString *str,
                                                    const moduleType *mt,
                                                    int encver);

**Available since:** 7.0.0

Decode a serialized representation of a module data type 'mt', in a specific encoding version 'encver'
from string 'str' and return a newly allocated value, or NULL if decoding failed.

This call basically reuses the '`rdb_load`' callback which module data types
implement in order to allow a module to arbitrarily serialize/de-serialize
keys, similar to how the 'DUMP' and 'RESTORE' commands are implemented.

Modules should generally use the `VALKEYMODULE_OPTIONS_HANDLE_IO_ERRORS` flag and
make sure the de-serialization code properly checks and handles IO errors
(freeing allocated buffers and returning a NULL).

If this is NOT done, the server will handle corrupted (or just truncated) serialized
data by producing an error message and terminating the process.

<span id="ValkeyModule_LoadDataTypeFromString"></span>

### `ValkeyModule_LoadDataTypeFromString`

    void *ValkeyModule_LoadDataTypeFromString(const ValkeyModuleString *str,
                                              const moduleType *mt);

**Available since:** 6.0.0

Similar to [`ValkeyModule_LoadDataTypeFromStringEncver`](#ValkeyModule_LoadDataTypeFromStringEncver), original version of the API, kept
for backward compatibility.

<span id="ValkeyModule_SaveDataTypeToString"></span>

### `ValkeyModule_SaveDataTypeToString`

    ValkeyModuleString *ValkeyModule_SaveDataTypeToString(ValkeyModuleCtx *ctx,
                                                          void *data,
                                                          const moduleType *mt);

**Available since:** 6.0.0

Encode a module data type 'mt' value 'data' into serialized form, and return it
as a newly allocated `ValkeyModuleString`.

This call basically reuses the '`rdb_save`' callback which module data types
implement in order to allow a module to arbitrarily serialize/de-serialize
keys, similar to how the 'DUMP' and 'RESTORE' commands are implemented.

<span id="ValkeyModule_GetKeyNameFromDigest"></span>

### `ValkeyModule_GetKeyNameFromDigest`

    const ValkeyModuleString *ValkeyModule_GetKeyNameFromDigest(ValkeyModuleDigest *dig);

**Available since:** 7.0.0

Returns the name of the key currently being processed.

<span id="ValkeyModule_GetDbIdFromDigest"></span>

### `ValkeyModule_GetDbIdFromDigest`

    int ValkeyModule_GetDbIdFromDigest(ValkeyModuleDigest *dig);

**Available since:** 7.0.0

Returns the database id of the key currently being processed.

<span id="section-aof-api-for-modules-data-types"></span>

## AOF API for modules data types

<span id="ValkeyModule_EmitAOF"></span>

### `ValkeyModule_EmitAOF`

    void ValkeyModule_EmitAOF(ValkeyModuleIO *io,
                              const char *cmdname,
                              const char *fmt,
                              ...);

**Available since:** 4.0.0

Emits a command into the AOF during the AOF rewriting process. This function
is only called in the context of the `aof_rewrite` method of data types exported
by a module. The command works exactly like [`ValkeyModule_Call()`](#ValkeyModule_Call) in the way
the parameters are passed, but it does not return anything as the error
handling is performed by the server itself.

<span id="section-io-context-handling"></span>

## IO context handling

<span id="ValkeyModule_GetKeyNameFromIO"></span>

### `ValkeyModule_GetKeyNameFromIO`

    const ValkeyModuleString *ValkeyModule_GetKeyNameFromIO(ValkeyModuleIO *io);

**Available since:** 5.0.5

Returns the name of the key currently being processed.
There is no guarantee that the key name is always available, so this may return NULL.

<span id="ValkeyModule_GetKeyNameFromModuleKey"></span>

### `ValkeyModule_GetKeyNameFromModuleKey`

    const ValkeyModuleString *ValkeyModule_GetKeyNameFromModuleKey(ValkeyModuleKey *key);

**Available since:** 6.0.0

Returns a `ValkeyModuleString` with the name of the key from `ValkeyModuleKey`.

<span id="ValkeyModule_GetDbIdFromModuleKey"></span>

### `ValkeyModule_GetDbIdFromModuleKey`

    int ValkeyModule_GetDbIdFromModuleKey(ValkeyModuleKey *key);

**Available since:** 7.0.0

Returns a database id of the key from `ValkeyModuleKey`.

<span id="ValkeyModule_GetDbIdFromIO"></span>

### `ValkeyModule_GetDbIdFromIO`

    int ValkeyModule_GetDbIdFromIO(ValkeyModuleIO *io);

**Available since:** 7.0.0

Returns the database id of the key currently being processed.
There is no guarantee that this info is always available, so this may return -1.

<span id="section-logging"></span>

## Logging

<span id="ValkeyModule_Log"></span>

### `ValkeyModule_Log`

    void ValkeyModule_Log(ValkeyModuleCtx *ctx,
                          const char *levelstr,
                          const char *fmt,
                          ...);

**Available since:** 4.0.0

Produces a log message to the standard server log, the format accepts
printf-alike specifiers, while level is a string describing the log
level to use when emitting the log, and must be one of the following:

* "debug" (`VALKEYMODULE_LOGLEVEL_DEBUG`)
* "verbose" (`VALKEYMODULE_LOGLEVEL_VERBOSE`)
* "notice" (`VALKEYMODULE_LOGLEVEL_NOTICE`)
* "warning" (`VALKEYMODULE_LOGLEVEL_WARNING`)

If the specified log level is invalid, verbose is used by default.
There is a fixed limit to the length of the log line this function is able
to emit, this limit is not specified but is guaranteed to be more than
a few lines of text.

The ctx argument may be NULL if cannot be provided in the context of the
caller for instance threads or callbacks, in which case a generic "module"
will be used instead of the module name.

<span id="ValkeyModule_LogIOError"></span>

### `ValkeyModule_LogIOError`

    void ValkeyModule_LogIOError(ValkeyModuleIO *io,
                                 const char *levelstr,
                                 const char *fmt,
                                 ...);

**Available since:** 4.0.0

Log errors from RDB / AOF serialization callbacks.

This function should be used when a callback is returning a critical
error to the caller since cannot load or save the data for some
critical reason.

<span id="ValkeyModule__Assert"></span>

### `ValkeyModule__Assert`

    void ValkeyModule__Assert(const char *estr, const char *file, int line);

**Available since:** 6.0.0

Valkey assert function.

The macro `ValkeyModule_Assert(expression)` is recommended, rather than
calling this function directly.

A failed assertion will shut down the server and produce logging information
that looks identical to information generated by the server itself.

<span id="ValkeyModule_LatencyAddSample"></span>

### `ValkeyModule_LatencyAddSample`

    void ValkeyModule_LatencyAddSample(const char *event, mstime_t latency);

**Available since:** 6.0.0

Allows adding event to the latency monitor to be observed by the LATENCY
command. The call is skipped if the latency is smaller than the configured
latency-monitor-threshold.

<span id="section-blocking-clients-from-modules"></span>

## Blocking clients from modules

For a guide about blocking commands in modules, see
[https://valkey.io/topics/modules-blocking-ops](https://valkey.io/topics/modules-blocking-ops).

<span id="ValkeyModule_RegisterAuthCallback"></span>

### `ValkeyModule_RegisterAuthCallback`

    void ValkeyModule_RegisterAuthCallback(ValkeyModuleCtx *ctx,
                                           ValkeyModuleAuthCallback cb);

**Available since:** 7.2.0

This API registers a callback to execute in addition to normal password based authentication.
Multiple callbacks can be registered across different modules. When a Module is unloaded, all the
auth callbacks registered by it are unregistered.
The callbacks are attempted (in the order of most recently registered first) when the AUTH/HELLO
(with AUTH field provided) commands are called.
The callbacks will be called with a module context along with a username and a password, and are
expected to take one of the following actions:
(1) Authenticate - Use the `ValkeyModule_AuthenticateClient`* API and return `VALKEYMODULE_AUTH_HANDLED`.
This will immediately end the auth chain as successful and add the OK reply.
(2) Deny Authentication - Return `VALKEYMODULE_AUTH_HANDLED` without authenticating or blocking the
client. Optionally, `err` can be set to a custom error message and `err` will be automatically
freed by the server.
This will immediately end the auth chain as unsuccessful and add the ERR reply.
(3) Block a client on authentication - Use the [`ValkeyModule_BlockClientOnAuth`](#ValkeyModule_BlockClientOnAuth) API and return
`VALKEYMODULE_AUTH_HANDLED`. Here, the client will be blocked until the [`ValkeyModule_UnblockClient`](#ValkeyModule_UnblockClient) API is used
which will trigger the auth reply callback (provided through the [`ValkeyModule_BlockClientOnAuth`](#ValkeyModule_BlockClientOnAuth)).
In this reply callback, the Module should authenticate, deny or skip handling authentication.
(4) Skip handling Authentication - Return `VALKEYMODULE_AUTH_NOT_HANDLED` without blocking the
client. This will allow the engine to attempt the next module auth callback.
If none of the callbacks authenticate or deny auth, then password based auth is attempted and
will authenticate or add failure logs and reply to the clients accordingly.

Note: If a client is disconnected while it was in the middle of blocking module auth, that
occurrence of the AUTH or HELLO command will not be tracked in the INFO command stats.

The following is an example of how non-blocking module based authentication can be used:

     int auth_cb(ValkeyModuleCtx *ctx, ValkeyModuleString *username, ValkeyModuleString *password, ValkeyModuleString **err) {
         const char *user = ValkeyModule_StringPtrLen(username, NULL);
         const char *pwd = ValkeyModule_StringPtrLen(password, NULL);
         if (!strcmp(user,"foo") && !strcmp(pwd,"valid_password")) {
             ValkeyModule_AuthenticateClientWithACLUser(ctx, "foo", 3, NULL, NULL, NULL);
             return VALKEYMODULE_AUTH_HANDLED;
         }

         else if (!strcmp(user,"foo") && !strcmp(pwd,"wrong_password")) {
             ValkeyModuleString *log = ValkeyModule_CreateString(ctx, "Module Auth", 11);
             ValkeyModule_ACLAddLogEntryByUserName(ctx, username, log, VALKEYMODULE_ACL_LOG_AUTH);
             ValkeyModule_FreeString(ctx, log);
             const char *err_msg = "Auth denied by Misc Module.";
             *err = ValkeyModule_CreateString(ctx, err_msg, strlen(err_msg));
             return VALKEYMODULE_AUTH_HANDLED;
         }
         return VALKEYMODULE_AUTH_NOT_HANDLED;
      }

     int ValkeyModule_OnLoad(ValkeyModuleCtx *ctx, ValkeyModuleString **argv, int argc) {
         if (ValkeyModule_Init(ctx,"authmodule",1,VALKEYMODULE_APIVER_1)== VALKEYMODULE_ERR)
             return VALKEYMODULE_ERR;
         ValkeyModule_RegisterAuthCallback(ctx, auth_cb);
         return VALKEYMODULE_OK;
     }

<span id="ValkeyModule_BlockClient"></span>

### `ValkeyModule_BlockClient`

    ValkeyModuleBlockedClient *ValkeyModule_BlockClient(ValkeyModuleCtx *ctx,
                                                        ValkeyModuleCmdFunc reply_callback,
                                                        ValkeyModuleCmdFunc timeout_callback,
                                                        void (*free_privdata)(ValkeyModuleCtx *, void *),
                                                        long long timeout_ms);

**Available since:** 4.0.0

Block a client in the context of a blocking command, returning a handle
which will be used, later, in order to unblock the client with a call to
[`ValkeyModule_UnblockClient()`](#ValkeyModule_UnblockClient). The arguments specify callback functions
and a timeout after which the client is unblocked.

The callbacks are called in the following contexts:

    reply_callback:   called after a successful ValkeyModule_UnblockClient()
                      call in order to reply to the client and unblock it.

    timeout_callback: called when the timeout is reached or if `CLIENT UNBLOCK`
                      is invoked, in order to send an error to the client.

    free_privdata:    called in order to free the private data that is passed
                      by ValkeyModule_UnblockClient() call.

Notes:
1. [`ValkeyModule_UnblockClient`](#ValkeyModule_UnblockClient) should be called for every blocked client,
even if client was killed, timed-out or disconnected. Failing to do so
will result in memory leaks.
2. Attempting to block the client on keyspace event notification in versions
   prior to 8.1.1 leads to a crash.

There are some cases where [`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient) cannot be used:

1. If the client is executing a script.
2. If the client is executing a MULTI block.
3. If the client is a temporary module client.
4. If the client is already blocked.

In cases 1 and 2, a call to [`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient) will **not** block the
client, but instead produce a specific error reply. Note that if the
BlockClient call originated from within a keyspace notification, no error
reply is generated but nullptr is returned while the errno is set to EINVAL.

In case 3 and 4, a call to [`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient) are no-op, returning
nullptr. errno is set to EINVAL for case 3 while ENOTSUP for case 4.

A module that registers a `timeout_callback` function can also be unblocked
using the `CLIENT UNBLOCK` command, which will trigger the timeout callback.
If a callback function is not registered, then the blocked client will be
treated as if it is not in a blocked state and `CLIENT UNBLOCK` will return
a zero value.

Measuring background time: By default the time spent in the blocked command
is not account for the total command duration. To include such time you should
use [`ValkeyModule_BlockedClientMeasureTimeStart()`](#ValkeyModule_BlockedClientMeasureTimeStart) and [`ValkeyModule_BlockedClientMeasureTimeEnd()`](#ValkeyModule_BlockedClientMeasureTimeEnd) one,
or multiple times within the blocking command background work.

<span id="ValkeyModule_BlockClientOnAuth"></span>

### `ValkeyModule_BlockClientOnAuth`

    ValkeyModuleBlockedClient *ValkeyModule_BlockClientOnAuth(ValkeyModuleCtx *ctx,
                                                              ValkeyModuleAuthCallback reply_callback,
                                                              void (*free_privdata)(ValkeyModuleCtx *, void *));

**Available since:** 7.2.0

Block the current client for module authentication in the background. If module auth is not in
progress on the client, the API returns NULL. Otherwise, the client is blocked and the `ValkeyModule_BlockedClient`
is returned similar to the [`ValkeyModule_BlockClient`](#ValkeyModule_BlockClient) API.
Note: Only use this API from the context of a module auth callback.

There are some cases where [`ValkeyModule_BlockClientOnAuth()`](#ValkeyModule_BlockClientOnAuth) cannot be used:

1. If the client is not in the middle of module based authentication. This will not block the client
   but instead produce a specific error reply.

For details on other return values and error codes, see the comment block for
[`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient).

<span id="ValkeyModule_BlockClientGetPrivateData"></span>

### `ValkeyModule_BlockClientGetPrivateData`

    void *ValkeyModule_BlockClientGetPrivateData(ValkeyModuleBlockedClient *blocked_client);

**Available since:** 7.2.0

Get the private data that was previusely set on a blocked client

<span id="ValkeyModule_BlockClientSetPrivateData"></span>

### `ValkeyModule_BlockClientSetPrivateData`

    void ValkeyModule_BlockClientSetPrivateData(ValkeyModuleBlockedClient *blocked_client,
                                                void *private_data);

**Available since:** 7.2.0

Set private data on a blocked client

<span id="ValkeyModule_BlockClientOnKeys"></span>

### `ValkeyModule_BlockClientOnKeys`

    ValkeyModuleBlockedClient *ValkeyModule_BlockClientOnKeys(ValkeyModuleCtx *ctx,
                                                              ValkeyModuleCmdFunc reply_callback,
                                                              ValkeyModuleCmdFunc timeout_callback,
                                                              void (*free_privdata)(ValkeyModuleCtx *, void *),
                                                              long long timeout_ms,
                                                              ValkeyModuleString **keys,
                                                              int numkeys,
                                                              void *privdata);

**Available since:** 6.0.0

This call is similar to [`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient), however in this case we
don't just block the client, but also ask the server to unblock it automatically
once certain keys become "ready", that is, contain more data.

Basically this is similar to what a typical command usually does,
like BLPOP or BZPOPMAX: the client blocks if it cannot be served ASAP,
and later when the key receives new data (a list push for instance), the
client is unblocked and served.

However in the case of this module API, when the client is unblocked?

1. If you block on a key of a type that has blocking operations associated,
   like a list, a sorted set, a stream, and so forth, the client may be
   unblocked once the relevant key is targeted by an operation that normally
   unblocks the native blocking operations for that type. So if we block
   on a list key, an RPUSH command may unblock our client and so forth.
2. If you are implementing your native data type, or if you want to add new
   unblocking conditions in addition to "1", you can call the modules API
   [`ValkeyModule_SignalKeyAsReady()`](#ValkeyModule_SignalKeyAsReady).

Anyway we can't be sure if the client should be unblocked just because the
key is signaled as ready: for instance a successive operation may change the
key, or a client in queue before this one can be served, modifying the key
as well and making it empty again. So when a client is blocked with
[`ValkeyModule_BlockClientOnKeys()`](#ValkeyModule_BlockClientOnKeys) the reply callback is not called after
[`ValkeyModule_UnblockClient()`](#ValkeyModule_UnblockClient) is called, but every time a key is signaled as ready:
if the reply callback can serve the client, it returns `VALKEYMODULE_OK`
and the client is unblocked, otherwise it will return `VALKEYMODULE_ERR`
and we'll try again later.

The reply callback can access the key that was signaled as ready by
calling the API [`ValkeyModule_GetBlockedClientReadyKey()`](#ValkeyModule_GetBlockedClientReadyKey), that returns
just the string name of the key as a `ValkeyModuleString` object.

Thanks to this system we can setup complex blocking scenarios, like
unblocking a client only if a list contains at least 5 items or other
more fancy logics.

Note that another difference with [`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient), is that here
we pass the private data directly when blocking the client: it will
be accessible later in the reply callback. Normally when blocking with
[`ValkeyModule_BlockClient()`](#ValkeyModule_BlockClient) the private data to reply to the client is
passed when calling [`ValkeyModule_UnblockClient()`](#ValkeyModule_UnblockClient) but here the unblocking
is performed by the server itself, so we need to have some private data before
hand. The private data is used to store any information about the specific
unblocking operation that you are implementing. Such information will be
freed using the `free_privdata` callback provided by the user.

However the reply callback will be able to access the argument vector of
the command, so the private data is often not needed.

Note: Under normal circumstances [`ValkeyModule_UnblockClient`](#ValkeyModule_UnblockClient) should not be
      called for clients that are blocked on keys (Either the key will
      become ready or a timeout will occur). If for some reason you do want
      to call ValkeyModule_UnblockClient it is possible: Client will be
      handled as if it were timed-out (You must implement the timeout
      callback in that case).

<span id="ValkeyModule_BlockClientOnKeysWithFlags"></span>

### `ValkeyModule_BlockClientOnKeysWithFlags`

    ValkeyModuleBlockedClient *ValkeyModule_BlockClientOnKeysWithFlags(ValkeyModuleCtx *ctx,
                                                                       ValkeyModuleCmdFunc reply_callback,
                                                                       ValkeyModuleCmdFunc timeout_callback,
                                                                       void (*free_privdata)(ValkeyModuleCtx *, void *),
                                                                       long long timeout_ms,
                                                                       ValkeyModuleString **keys,
                                                                       int numkeys,
                                                                       void *privdata,
                                                                       int flags);

**Available since:** 7.2.0

Same as [`ValkeyModule_BlockClientOnKeys`](#ValkeyModule_BlockClientOnKeys), but can take `VALKEYMODULE_BLOCK_`* flags
Can be either `VALKEYMODULE_BLOCK_UNBLOCK_DEFAULT`, which means default behavior (same
as calling [`ValkeyModule_BlockClientOnKeys`](#ValkeyModule_BlockClientOnKeys))

The flags is a bit mask of these:

- `VALKEYMODULE_BLOCK_UNBLOCK_DELETED`: The clients should to be awakened in case any of `keys` are deleted.
                                       Mostly useful for commands that require the key to exist (like XREADGROUP)

<span id="ValkeyModule_SignalKeyAsReady"></span>

### `ValkeyModule_SignalKeyAsReady`

    void ValkeyModule_SignalKeyAsReady(ValkeyModuleCtx *ctx,
                                       ValkeyModuleString *key);

**Available since:** 6.0.0

This function is used in order to potentially unblock a client blocked
on keys with [`ValkeyModule_BlockClientOnKeys()`](#ValkeyModule_BlockClientOnKeys). When this function is called,
all the clients blocked for this key will get their `reply_callback` called.

<span id="ValkeyModule_UnblockClient"></span>

### `ValkeyModule_UnblockClient`

    int ValkeyModule_UnblockClient(ValkeyModuleBlockedClient *bc, void *privdata);

**Available since:** 4.0.0

Unblock a client blocked by `ValkeyModule_BlockedClient`. This will trigger
the reply callbacks to be called in order to reply to the client.
The 'privdata' argument will be accessible by the reply callback, so
the caller of this function can pass any value that is needed in order to
actually reply to the client.

A common usage for 'privdata' is a thread that computes something that
needs to be passed to the client, included but not limited some slow
to compute reply or some reply obtained via networking.

Returns `VALKEYMODULE_OK` on success. On failure, `VALKEYMODULE_ERR` is returned
and `errno` is set as follows:

- EINVAL if bc is NULL.
- ENOTSUP if bc contains `blocked on keys` but its timeout callback is NULL.

Note 1: this function can be called from threads spawned by the module.

Note 2: when we unblock a client that is blocked for keys using the API
[`ValkeyModule_BlockClientOnKeys()`](#ValkeyModule_BlockClientOnKeys), the privdata argument here is not used.
Unblocking a client that was blocked for keys using this API will still
require the client to get some reply, so the function will use the
"timeout" handler in order to do so (The privdata provided in
[`ValkeyModule_BlockClientOnKeys()`](#ValkeyModule_BlockClientOnKeys) is accessible from the timeout
callback via [`ValkeyModule_GetBlockedClientPrivateData`](#ValkeyModule_GetBlockedClientPrivateData)).

<span id="ValkeyModule_AbortBlock"></span>

### `ValkeyModule_AbortBlock`

    int ValkeyModule_AbortBlock(ValkeyModuleBlockedClient *bc);

**Available since:** 4.0.0

Abort a blocked client blocking operation: the client will be unblocked
without firing any callback.

<span id="ValkeyModule_SetDisconnectCallback"></span>

### `ValkeyModule_SetDisconnectCallback`

    void ValkeyModule_SetDisconnectCallback(ValkeyModuleBlockedClient *bc,
                                            ValkeyModuleDisconnectFunc callback);

**Available since:** 5.0.0

Set a callback that will be called if a blocked client disconnects
before the module has a chance to call [`ValkeyModule_UnblockClient()`](#ValkeyModule_UnblockClient)

Usually what you want to do there, is to cleanup your module state
so that you can call [`ValkeyModule_UnblockClient()`](#ValkeyModule_UnblockClient) safely, otherwise
the client will remain blocked forever if the timeout is large.

Notes:

1. It is not safe to call Reply* family functions here, it is also
   useless since the client is gone.

2. This callback is not called if the client disconnects because of
   a timeout. In such a case, the client is unblocked automatically
   and the timeout callback is called.

<span id="ValkeyModule_IsBlockedReplyRequest"></span>

### `ValkeyModule_IsBlockedReplyRequest`

    int ValkeyModule_IsBlockedReplyRequest(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Return non-zero if a module command was called in order to fill the
reply for a blocked client.

<span id="ValkeyModule_IsBlockedTimeoutRequest"></span>

### `ValkeyModule_IsBlockedTimeoutRequest`

    int ValkeyModule_IsBlockedTimeoutRequest(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Return non-zero if a module command was called in order to fill the
reply for a blocked client that timed out.

<span id="ValkeyModule_GetBlockedClientPrivateData"></span>

### `ValkeyModule_GetBlockedClientPrivateData`

    void *ValkeyModule_GetBlockedClientPrivateData(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Get the private data set by [`ValkeyModule_UnblockClient()`](#ValkeyModule_UnblockClient)

<span id="ValkeyModule_GetBlockedClientReadyKey"></span>

### `ValkeyModule_GetBlockedClientReadyKey`

    ValkeyModuleString *ValkeyModule_GetBlockedClientReadyKey(ValkeyModuleCtx *ctx);

**Available since:** 6.0.0

Get the key that is ready when the reply callback is called in the context
of a client blocked by [`ValkeyModule_BlockClientOnKeys()`](#ValkeyModule_BlockClientOnKeys).

<span id="ValkeyModule_GetBlockedClientHandle"></span>

### `ValkeyModule_GetBlockedClientHandle`

    ValkeyModuleBlockedClient *ValkeyModule_GetBlockedClientHandle(ValkeyModuleCtx *ctx);

**Available since:** 5.0.0

Get the blocked client associated with a given context.
This is useful in the reply and timeout callbacks of blocked clients,
before sometimes the module has the blocked client handle references
around, and wants to cleanup it.

<span id="ValkeyModule_BlockedClientDisconnected"></span>

### `ValkeyModule_BlockedClientDisconnected`

    int ValkeyModule_BlockedClientDisconnected(ValkeyModuleCtx *ctx);

**Available since:** 5.0.0

Return true if when the free callback of a blocked client is called,
the reason for the client to be unblocked is that it disconnected
while it was blocked.

<span id="section-thread-safe-contexts"></span>

## Thread Safe Contexts

<span id="ValkeyModule_GetThreadSafeContext"></span>

### `ValkeyModule_GetThreadSafeContext`

    ValkeyModuleCtx *ValkeyModule_GetThreadSafeContext(ValkeyModuleBlockedClient *bc);

**Available since:** 4.0.0

Return a context which can be used inside threads to make calls requiring a
context with certain modules APIs. If 'bc' is not NULL then the module will
be bound to a blocked client, and it will be possible to use the
`ValkeyModule_Reply*` family of functions to accumulate a reply for when the
client will be unblocked. Otherwise the thread safe context will be
detached by a specific client.

To call non-reply APIs, the thread safe context must be prepared with:

    ValkeyModule_ThreadSafeContextLock(ctx);
    ... make your call here ...
    ValkeyModule_ThreadSafeContextUnlock(ctx);

This is not needed when using `ValkeyModule_Reply*` functions, assuming
that a blocked client was used when the context was created, otherwise
no `ValkeyModule_Reply`* call should be made at all.

NOTE: If you're creating a detached thread safe context (bc is NULL),
consider using [`ValkeyModule_GetDetachedThreadSafeContext`](#ValkeyModule_GetDetachedThreadSafeContext) which will also retain
the module ID and thus be more useful for logging.

<span id="ValkeyModule_GetDetachedThreadSafeContext"></span>

### `ValkeyModule_GetDetachedThreadSafeContext`

    ValkeyModuleCtx *ValkeyModule_GetDetachedThreadSafeContext(ValkeyModuleCtx *ctx);

**Available since:** 6.0.9

Return a detached thread safe context that is not associated with any
specific blocked client, but is associated with the module's context.

This is useful for modules that wish to hold a global context over
a long term, for purposes such as logging.

<span id="ValkeyModule_FreeThreadSafeContext"></span>

### `ValkeyModule_FreeThreadSafeContext`

    void ValkeyModule_FreeThreadSafeContext(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Release a thread safe context.

<span id="ValkeyModule_ThreadSafeContextLock"></span>

### `ValkeyModule_ThreadSafeContextLock`

    void ValkeyModule_ThreadSafeContextLock(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Acquire the server lock before executing a thread safe API call.
This is not needed for `ValkeyModule_Reply*` calls when there is
a blocked client connected to the thread safe context.

<span id="ValkeyModule_ThreadSafeContextTryLock"></span>

### `ValkeyModule_ThreadSafeContextTryLock`

    int ValkeyModule_ThreadSafeContextTryLock(ValkeyModuleCtx *ctx);

**Available since:** 6.0.8

Similar to [`ValkeyModule_ThreadSafeContextLock`](#ValkeyModule_ThreadSafeContextLock) but this function
would not block if the server lock is already acquired.

If successful (lock acquired) `VALKEYMODULE_OK` is returned,
otherwise `VALKEYMODULE_ERR` is returned and errno is set
accordingly.

<span id="ValkeyModule_ThreadSafeContextUnlock"></span>

### `ValkeyModule_ThreadSafeContextUnlock`

    void ValkeyModule_ThreadSafeContextUnlock(ValkeyModuleCtx *ctx);

**Available since:** 4.0.0

Release the server lock after a thread safe API call was executed.

<span id="section-module-keyspace-notifications-api"></span>

## Module Keyspace Notifications API

<span id="ValkeyModule_SubscribeToKeyspaceEvents"></span>

### `ValkeyModule_SubscribeToKeyspaceEvents`

    int ValkeyModule_SubscribeToKeyspaceEvents(ValkeyModuleCtx *ctx,
                                               int types,
                                               ValkeyModuleNotificationFunc callback);

**Available since:** 4.0.9

Subscribe to keyspace notifications. This is a low-level version of the
keyspace-notifications API. A module can register callbacks to be notified
when keyspace events occur.

Notification events are filtered by their type (string events, set events,
etc), and the subscriber callback receives only events that match a specific
mask of event types.

When subscribing to notifications with [`ValkeyModule_SubscribeToKeyspaceEvents`](#ValkeyModule_SubscribeToKeyspaceEvents)
the module must provide an event type-mask, denoting the events the subscriber
is interested in. This can be an ORed mask of any of the following flags:

 - `VALKEYMODULE_NOTIFY_GENERIC`: Generic commands like DEL, EXPIRE, RENAME
 - `VALKEYMODULE_NOTIFY_STRING`: String events
 - `VALKEYMODULE_NOTIFY_LIST`: List events
 - `VALKEYMODULE_NOTIFY_SET`: Set events
 - `VALKEYMODULE_NOTIFY_HASH`: Hash events
 - `VALKEYMODULE_NOTIFY_ZSET`: Sorted Set events
 - `VALKEYMODULE_NOTIFY_EXPIRED`: Expiration events
 - `VALKEYMODULE_NOTIFY_EVICTED`: Eviction events
 - `VALKEYMODULE_NOTIFY_STREAM`: Stream events
 - `VALKEYMODULE_NOTIFY_MODULE`: Module types events
 - `VALKEYMODULE_NOTIFY_KEYMISS`: Key-miss events
                               Notice, key-miss event is the only type
                               of event that is fired from within a read command.
                               Performing ValkeyModule_Call with a write command from within
                               this notification is wrong and discourage. It will
                               cause the read command that trigger the event to be
                               replicated to the AOF/Replica.
 - `VALKEYMODULE_NOTIFY_ALL`: All events (Excluding `VALKEYMODULE_NOTIFY_KEYMISS`)
 - `VALKEYMODULE_NOTIFY_LOADED`: A special notification available only for modules,
                              indicates that the key was loaded from persistence.
                              Notice, when this event fires, the given key
                              can not be retained, use ValkeyModule_CreateStringFromString
                              instead.

We do not distinguish between key events and keyspace events, and it is up
to the module to filter the actions taken based on the key.

The subscriber signature is:

    int (*ValkeyModuleNotificationFunc) (ValkeyModuleCtx *ctx, int type,
                                        const char *event,
                                        ValkeyModuleString *key);

`type` is the event type bit, that must match the mask given at registration
time. The event string is the actual command being executed, and key is the
relevant key.

Notification callback gets executed with a context that can not be
used to send anything to the client, and has the db number where the event
occurred as its selected db number.

Notice that it is not necessary to enable notifications in valkey.conf for
module notifications to work.

Warning: the notification callbacks are performed in a synchronous manner,
so notification callbacks must to be fast, or they would slow the server down.
If you need to take long actions, use threads to offload them.

Moreover, the fact that the notification is executed synchronously means
that the notification code will be executed in the middle of server logic
(commands logic, eviction, expire). Changing the key space while the logic
runs is dangerous and discouraged. In order to react to key space events with
write actions, please refer to [`ValkeyModule_AddPostNotificationJob`](#ValkeyModule_AddPostNotificationJob).

See [https://valkey.io/topics/notifications](https://valkey.io/topics/notifications) for more information.

<span id="ValkeyModule_AddPostNotificationJob"></span>

### `ValkeyModule_AddPostNotificationJob`

    int ValkeyModule_AddPostNotificationJob(ValkeyModuleCtx *ctx,
                                            ValkeyModulePostNotificationJobFunc callback,
                                            void *privdata,
                                            void (*free_privdata)(void *));

**Available since:** 7.2.0

When running inside a key space notification callback, it is dangerous and highly discouraged to perform any write
operation (See [`ValkeyModule_SubscribeToKeyspaceEvents`](#ValkeyModule_SubscribeToKeyspaceEvents)). In order to still perform write actions in this scenario,
the server provides [`ValkeyModule_AddPostNotificationJob`](#ValkeyModule_AddPostNotificationJob) API. The API allows to register a job callback which the server will
call when the following condition are promised to be fulfilled:
1. It is safe to perform any write operation.
2. The job will be called atomically along side the key space notification.

Notice, one job might trigger key space notifications that will trigger more jobs.
This raises a concerns of entering an infinite loops, we consider infinite loops
as a logical bug that need to be fixed in the module, an attempt to protect against
infinite loops by halting the execution could result in violation of the feature correctness
and so the server will make no attempt to protect the module from infinite loops.

'`free_pd`' can be NULL and in such case will not be used.

Return `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` if was called while loading data from disk (AOF or RDB) or
if the instance is a readonly replica.

<span id="ValkeyModule_GetNotifyKeyspaceEvents"></span>

### `ValkeyModule_GetNotifyKeyspaceEvents`

    int ValkeyModule_GetNotifyKeyspaceEvents(void);

**Available since:** 6.0.0

Get the configured bitmap of notify-keyspace-events (Could be used
for additional filtering in `ValkeyModuleNotificationFunc`)

<span id="ValkeyModule_NotifyKeyspaceEvent"></span>

### `ValkeyModule_NotifyKeyspaceEvent`

    int ValkeyModule_NotifyKeyspaceEvent(ValkeyModuleCtx *ctx,
                                         int type,
                                         const char *event,
                                         ValkeyModuleString *key);

**Available since:** 6.0.0

Expose notifyKeyspaceEvent to modules

<span id="section-modules-cluster-api"></span>

## Modules Cluster API

<span id="ValkeyModule_RegisterClusterMessageReceiver"></span>

### `ValkeyModule_RegisterClusterMessageReceiver`

    void ValkeyModule_RegisterClusterMessageReceiver(ValkeyModuleCtx *ctx,
                                                     uint8_t type,
                                                     ValkeyModuleClusterMessageReceiver callback);

**Available since:** 5.0.0

Register a callback receiver for cluster messages of type 'type'. If there
was already a registered callback, this will replace the callback function
with the one provided, otherwise if the callback is set to NULL and there
is already a callback for this function, the callback is unregistered
(so this API call is also used in order to delete the receiver).

When a message of this type is received, the registered callback function
will be invoked with details, including the 40-byte node ID of the sender.

In Valkey 8.1 and later, the node ID is null-terminated. Prior to 8.1, it was
not null-terminated

<span id="ValkeyModule_SendClusterMessage"></span>

### `ValkeyModule_SendClusterMessage`

    int ValkeyModule_SendClusterMessage(ValkeyModuleCtx *ctx,
                                        const char *target_id,
                                        uint8_t type,
                                        const char *msg,
                                        uint32_t len);

**Available since:** 5.0.0

Send a message to all the nodes in the cluster if `target` is NULL, otherwise
at the specified target, which is a `VALKEYMODULE_NODE_ID_LEN` bytes node ID, as
returned by the receiver callback or by the nodes iteration functions.

In Valkey 8.1 and later, the cluster protocol overhead for this message is
~30B, to compare with earlier versions where it's ~2KB.

The function returns `VALKEYMODULE_OK` if the message was successfully sent,
otherwise if the node is not connected or such node ID does not map to any
known cluster node, `VALKEYMODULE_ERR` is returned.

<span id="ValkeyModule_GetClusterNodesList"></span>

### `ValkeyModule_GetClusterNodesList`

    char **ValkeyModule_GetClusterNodesList(ValkeyModuleCtx *ctx, size_t *numnodes);

**Available since:** 5.0.0

Return an array of string pointers, each string pointer points to a cluster
node ID of exactly `VALKEYMODULE_NODE_ID_LEN` bytes (without any null term).
The number of returned node IDs is stored into `*numnodes`.
However if this function is called by a module not running an an
instance with Cluster enabled, NULL is returned instead.

The IDs returned can be used with [`ValkeyModule_GetClusterNodeInfo()`](#ValkeyModule_GetClusterNodeInfo) in order
to get more information about single node.

The array returned by this function must be freed using the function
[`ValkeyModule_FreeClusterNodesList()`](#ValkeyModule_FreeClusterNodesList).

Example:

    size_t count, j;
    char **ids = ValkeyModule_GetClusterNodesList(ctx,&count);
    for (j = 0; j < count; j++) {
        ValkeyModule_Log(ctx,"notice","Node %.*s",
            VALKEYMODULE_NODE_ID_LEN,ids[j]);
    }
    ValkeyModule_FreeClusterNodesList(ids);

<span id="ValkeyModule_FreeClusterNodesList"></span>

### `ValkeyModule_FreeClusterNodesList`

    void ValkeyModule_FreeClusterNodesList(char **ids);

**Available since:** 5.0.0

Free the node list obtained with [`ValkeyModule_GetClusterNodesList`](#ValkeyModule_GetClusterNodesList).

<span id="ValkeyModule_GetMyClusterID"></span>

### `ValkeyModule_GetMyClusterID`

    const char *ValkeyModule_GetMyClusterID(void);

**Available since:** 5.0.0

Return this node ID (`VALKEYMODULE_CLUSTER_ID_LEN` bytes) or NULL if the cluster
is disabled.

<span id="ValkeyModule_GetClusterSize"></span>

### `ValkeyModule_GetClusterSize`

    size_t ValkeyModule_GetClusterSize(void);

**Available since:** 5.0.0

Return the number of nodes in the cluster, regardless of their state
(handshake, noaddress, ...) so that the number of active nodes may actually
be smaller, but not greater than this number. If the instance is not in
cluster mode, zero is returned.

<span id="ValkeyModule_GetClusterNodeInfo"></span>

### `ValkeyModule_GetClusterNodeInfo`

    int ValkeyModule_GetClusterNodeInfo(ValkeyModuleCtx *ctx,
                                        const char *id,
                                        char *ip,
                                        char *primary_id,
                                        int *port,
                                        int *flags);

**Available since:** 5.0.0

Populate the specified info for the node having as ID the specified 'id',
then returns `VALKEYMODULE_OK`. Otherwise if the format of node ID is invalid
or the node ID does not exist from the POV of this local node, `VALKEYMODULE_ERR`
is returned.

The arguments `ip`, `primary_id`, `port` and `flags` can be NULL in case we don't
need to populate back certain info. If an `ip` and `primary_id` (only populated
if the instance is a replica) are specified, they point to buffers holding
at least `VALKEYMODULE_NODE_ID_LEN` bytes. The strings written back as `ip`
and `primary_id` are not null terminated.

The list of flags reported is the following:

* `VALKEYMODULE_NODE_MYSELF`:       This node
* `VALKEYMODULE_NODE_PRIMARY`:      The node is a primary
* `VALKEYMODULE_NODE_REPLICA`:      The node is a replica
* `VALKEYMODULE_NODE_PFAIL`:        We see the node as failing
* `VALKEYMODULE_NODE_FAIL`:         The cluster agrees the node is failing
* `VALKEYMODULE_NODE_NOFAILOVER`:   The replica is configured to never failover

<span id="ValkeyModule_GetClusterNodeInfoForClient"></span>

### `ValkeyModule_GetClusterNodeInfoForClient`

    int ValkeyModule_GetClusterNodeInfoForClient(ValkeyModuleCtx *ctx,
                                                 uint64_t client_id,
                                                 const char *node_id,
                                                 char *ip,
                                                 char *primary_id,
                                                 int *port,
                                                 int *flags);

**Available since:** 8.0.0

Like [`ValkeyModule_GetClusterNodeInfo()`](#ValkeyModule_GetClusterNodeInfo), but returns IP address specifically for the given
client, depending on whether the client is connected over IPv4 or IPv6.

See also [`ValkeyModule_GetClientId()`](#ValkeyModule_GetClientId).

<span id="ValkeyModule_SetClusterFlags"></span>

### `ValkeyModule_SetClusterFlags`

    void ValkeyModule_SetClusterFlags(ValkeyModuleCtx *ctx, uint64_t flags);

**Available since:** 5.0.0

Set Cluster flags in order to change the normal behavior of
Cluster, especially with the goal of disabling certain functions.
This is useful for modules that use the Cluster API in order to create
a different distributed system, but still want to use the Cluster
message bus. Flags that can be set:

* `CLUSTER_MODULE_FLAG_NO_FAILOVER`
* `CLUSTER_MODULE_FLAG_NO_REDIRECTION`

With the following effects:

* `NO_FAILOVER`: prevent Cluster replicas from failing over a dead primary.
               Also disables the replica migration feature.

* `NO_REDIRECTION`: Every node will accept any key, without trying to perform
                  partitioning according to the Cluster algorithm.
                  Slots information will still be propagated across the
                  cluster, but without effect.

<span id="ValkeyModule_ClusterKeySlot"></span>

### `ValkeyModule_ClusterKeySlot`

    unsigned int ValkeyModule_ClusterKeySlot(ValkeyModuleString *key);

**Available since:** 8.0.0

Returns the cluster slot of a key, similar to the `CLUSTER KEYSLOT` command.
This function works even if cluster mode is not enabled.

<span id="ValkeyModule_ClusterCanonicalKeyNameInSlot"></span>

### `ValkeyModule_ClusterCanonicalKeyNameInSlot`

    const char *ValkeyModule_ClusterCanonicalKeyNameInSlot(unsigned int slot);

**Available since:** 8.0.0

Returns a short string that can be used as a key or as a hash tag in a key,
such that the key maps to the given cluster slot. Returns NULL if slot is not
a valid slot.

<span id="section-modules-timers-api"></span>

## Modules Timers API

Module timers are a high precision "green timers" abstraction where
every module can register even millions of timers without problems, even if
the actual event loop will just have a single timer that is used to awake the
module timers subsystem in order to process the next event.

All the timers are stored into a radix tree, ordered by expire time, when
the main server event loop timer callback is called, we try to process all
the timers already expired one after the other. Then we re-enter the event
loop registering a timer that will expire when the next to process module
timer will expire.

Every time the list of active timers drops to zero, we unregister the
main event loop timer, so that there is no overhead when such feature is
not used.

<span id="ValkeyModule_CreateTimer"></span>

### `ValkeyModule_CreateTimer`

    ValkeyModuleTimerID ValkeyModule_CreateTimer(ValkeyModuleCtx *ctx,
                                                 mstime_t period,
                                                 ValkeyModuleTimerProc callback,
                                                 void *data);

**Available since:** 5.0.0

Create a new timer that will fire after `period` milliseconds, and will call
the specified function using `data` as argument. The returned timer ID can be
used to get information from the timer or to stop it before it fires.
Note that for the common use case of a repeating timer (Re-registration
of the timer inside the `ValkeyModuleTimerProc` callback) it matters when
this API is called:
If it is called at the beginning of 'callback' it means
the event will triggered every 'period'.
If it is called at the end of 'callback' it means
there will 'period' milliseconds gaps between events.
(If the time it takes to execute 'callback' is negligible the two
statements above mean the same)

<span id="ValkeyModule_StopTimer"></span>

### `ValkeyModule_StopTimer`

    int ValkeyModule_StopTimer(ValkeyModuleCtx *ctx,
                               ValkeyModuleTimerID id,
                               void **data);

**Available since:** 5.0.0

Stop a timer, returns `VALKEYMODULE_OK` if the timer was found, belonged to the
calling module, and was stopped, otherwise `VALKEYMODULE_ERR` is returned.
If not NULL, the data pointer is set to the value of the data argument when
the timer was created.

<span id="ValkeyModule_GetTimerInfo"></span>

### `ValkeyModule_GetTimerInfo`

    int ValkeyModule_GetTimerInfo(ValkeyModuleCtx *ctx,
                                  ValkeyModuleTimerID id,
                                  uint64_t *remaining,
                                  void **data);

**Available since:** 5.0.0

Obtain information about a timer: its remaining time before firing
(in milliseconds), and the private data pointer associated with the timer.
If the timer specified does not exist or belongs to a different module
no information is returned and the function returns `VALKEYMODULE_ERR`, otherwise
`VALKEYMODULE_OK` is returned. The arguments remaining or data can be NULL if
the caller does not need certain information.

<span id="section-modules-eventloop-api"></span>

## Modules EventLoop API

<span id="ValkeyModule_EventLoopAdd"></span>

### `ValkeyModule_EventLoopAdd`

    int ValkeyModule_EventLoopAdd(int fd,
                                  int mask,
                                  ValkeyModuleEventLoopFunc func,
                                  void *user_data);

**Available since:** 7.0.0

Add a pipe / socket event to the event loop.

* `mask` must be one of the following values:

    * `VALKEYMODULE_EVENTLOOP_READABLE`
    * `VALKEYMODULE_EVENTLOOP_WRITABLE`
    * `VALKEYMODULE_EVENTLOOP_READABLE | VALKEYMODULE_EVENTLOOP_WRITABLE`

On success `VALKEYMODULE_OK` is returned, otherwise
`VALKEYMODULE_ERR` is returned and errno is set to the following values:

* ERANGE: `fd` is negative or higher than `maxclients` server config.
* EINVAL: `callback` is NULL or `mask` value is invalid.

`errno` might take other values in case of an internal error.

Example:

    void onReadable(int fd, void *user_data, int mask) {
        char buf[32];
        int bytes = read(fd,buf,sizeof(buf));
        printf("Read %d bytes \n", bytes);
    }
    ValkeyModule_EventLoopAdd(fd, VALKEYMODULE_EVENTLOOP_READABLE, onReadable, NULL);

<span id="ValkeyModule_EventLoopDel"></span>

### `ValkeyModule_EventLoopDel`

    int ValkeyModule_EventLoopDel(int fd, int mask);

**Available since:** 7.0.0

Delete a pipe / socket event from the event loop.

* `mask` must be one of the following values:

    * `VALKEYMODULE_EVENTLOOP_READABLE`
    * `VALKEYMODULE_EVENTLOOP_WRITABLE`
    * `VALKEYMODULE_EVENTLOOP_READABLE | VALKEYMODULE_EVENTLOOP_WRITABLE`

On success `VALKEYMODULE_OK` is returned, otherwise
`VALKEYMODULE_ERR` is returned and errno is set to the following values:

* ERANGE: `fd` is negative or higher than `maxclients` server config.
* EINVAL: `mask` value is invalid.

<span id="ValkeyModule_EventLoopAddOneShot"></span>

### `ValkeyModule_EventLoopAddOneShot`

    int ValkeyModule_EventLoopAddOneShot(ValkeyModuleEventLoopOneShotFunc func,
                                         void *user_data);

**Available since:** 7.0.0

This function can be called from other threads to trigger callback on the server
main thread. On success `VALKEYMODULE_OK` is returned. If `func` is NULL
`VALKEYMODULE_ERR` is returned and errno is set to EINVAL.

<span id="section-modules-acl-api"></span>

## Modules ACL API

Implements a hook into the authentication and authorization within the server.

<span id="ValkeyModule_CreateModuleUser"></span>

### `ValkeyModule_CreateModuleUser`

    ValkeyModuleUser *ValkeyModule_CreateModuleUser(const char *name);

**Available since:** 6.0.0

Creates an ACL user that the module can use to authenticate a client.
After obtaining the user, the module should set what such user can do
using the `ValkeyModule_SetUserACL()` function. Once configured, the user
can be used in order to authenticate a connection, with the specified
ACL rules, using the `ValkeyModule_AuthClientWithUser()` function.

Note that:

* Users created here are not listed by the ACL command.
* Users created here are not checked for duplicated name, so it's up to
  the module calling this function to take care of not creating users
  with the same name.
* The created user can be used to authenticate multiple connections.

The caller can later free the user using the function
[`ValkeyModule_FreeModuleUser()`](#ValkeyModule_FreeModuleUser). When this function is called, if there are
still clients authenticated with this user, they are disconnected.
The function to free the user should only be used when the caller really
wants to invalidate the user to define a new one with different
capabilities.

<span id="ValkeyModule_FreeModuleUser"></span>

### `ValkeyModule_FreeModuleUser`

    int ValkeyModule_FreeModuleUser(ValkeyModuleUser *user);

**Available since:** 6.0.0

Frees a given user and disconnects all of the clients that have been
authenticated with it. See [`ValkeyModule_CreateModuleUser`](#ValkeyModule_CreateModuleUser) for detailed usage.

<span id="ValkeyModule_SetModuleUserACL"></span>

### `ValkeyModule_SetModuleUserACL`

    int ValkeyModule_SetModuleUserACL(ValkeyModuleUser *user, const char *acl);

**Available since:** 6.0.0

Sets the permissions of a user created through the module
interface. The syntax is the same as ACL SETUSER, so refer to the
documentation in acl.c for more information. See [`ValkeyModule_CreateModuleUser`](#ValkeyModule_CreateModuleUser)
for detailed usage.

Returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` on failure
and will set an errno describing why the operation failed.

<span id="ValkeyModule_SetModuleUserACLString"></span>

### `ValkeyModule_SetModuleUserACLString`

    int ValkeyModule_SetModuleUserACLString(ValkeyModuleCtx *ctx,
                                            ValkeyModuleUser *user,
                                            const char *acl,
                                            ValkeyModuleString **error);

**Available since:** 7.0.6

Sets the permission of a user with a complete ACL string, such as one
would use on the ACL SETUSER command line API. This differs from
[`ValkeyModule_SetModuleUserACL`](#ValkeyModule_SetModuleUserACL), which only takes single ACL operations at a time.

Returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` on failure
if a `ValkeyModuleString` is provided in error, a string describing the error
will be returned

<span id="ValkeyModule_GetModuleUserACLString"></span>

### `ValkeyModule_GetModuleUserACLString`

    ValkeyModuleString *ValkeyModule_GetModuleUserACLString(ValkeyModuleUser *user);

**Available since:** 7.0.6

Get the ACL string for a given user
Returns a `ValkeyModuleString`

<span id="ValkeyModule_GetCurrentUserName"></span>

### `ValkeyModule_GetCurrentUserName`

    ValkeyModuleString *ValkeyModule_GetCurrentUserName(ValkeyModuleCtx *ctx);

**Available since:** 7.0.0

Retrieve the user name of the client connection behind the current context.
The user name can be used later, in order to get a `ValkeyModuleUser`.
See more information in [`ValkeyModule_GetModuleUserFromUserName`](#ValkeyModule_GetModuleUserFromUserName).

The returned string must be released with [`ValkeyModule_FreeString()`](#ValkeyModule_FreeString) or by
enabling automatic memory management.

If the context is not associated with a client connection, NULL is returned
and errno is set to EINVAL.

<span id="ValkeyModule_GetModuleUserFromUserName"></span>

### `ValkeyModule_GetModuleUserFromUserName`

    ValkeyModuleUser *ValkeyModule_GetModuleUserFromUserName(ValkeyModuleString *name);

**Available since:** 7.0.0

A `ValkeyModuleUser` can be used to check if command, key or channel can be executed or
accessed according to the ACLs rules associated with that user.
When a Module wants to do ACL checks on a general ACL user (not created by [`ValkeyModule_CreateModuleUser`](#ValkeyModule_CreateModuleUser)),
it can get the `ValkeyModuleUser` from this API, based on the user name retrieved by [`ValkeyModule_GetCurrentUserName`](#ValkeyModule_GetCurrentUserName).

Since a general ACL user can be deleted at any time, this `ValkeyModuleUser` should be used only in the context
where this function was called. In order to do ACL checks out of that context, the Module can store the user name,
and call this API at any other context.

Returns NULL if the user is disabled or the user does not exist.
The caller should later free the user using the function [`ValkeyModule_FreeModuleUser()`](#ValkeyModule_FreeModuleUser).

<span id="ValkeyModule_ACLCheckCommandPermissions"></span>

### `ValkeyModule_ACLCheckCommandPermissions`

    int ValkeyModule_ACLCheckCommandPermissions(ValkeyModuleUser *user,
                                                ValkeyModuleString **argv,
                                                int argc);

**Available since:** 7.0.0

Checks if the command can be executed by the user, according to the ACLs associated with it.

On success a `VALKEYMODULE_OK` is returned, otherwise
`VALKEYMODULE_ERR` is returned and errno is set to the following values:

* ENOENT: Specified command does not exist.
* EACCES: Command cannot be executed, according to ACL rules

<span id="ValkeyModule_ACLCheckKeyPermissions"></span>

### `ValkeyModule_ACLCheckKeyPermissions`

    int ValkeyModule_ACLCheckKeyPermissions(ValkeyModuleUser *user,
                                            ValkeyModuleString *key,
                                            int flags);

**Available since:** 7.0.0

Check if the key can be accessed by the user according to the ACLs attached to the user
and the flags representing the key access. The flags are the same that are used in the
keyspec for logical operations. These flags are documented in [`ValkeyModule_SetCommandInfo`](#ValkeyModule_SetCommandInfo) as
the `VALKEYMODULE_CMD_KEY_ACCESS`, `VALKEYMODULE_CMD_KEY_UPDATE`, `VALKEYMODULE_CMD_KEY_INSERT`,
and `VALKEYMODULE_CMD_KEY_DELETE` flags.

If no flags are supplied, the user is still required to have some access to the key for
this command to return successfully.

If the user is able to access the key then `VALKEYMODULE_OK` is returned, otherwise
`VALKEYMODULE_ERR` is returned and errno is set to one of the following values:

* EINVAL: The provided flags are invalid.
* EACCESS: The user does not have permission to access the key.

<span id="ValkeyModule_ACLCheckChannelPermissions"></span>

### `ValkeyModule_ACLCheckChannelPermissions`

    int ValkeyModule_ACLCheckChannelPermissions(ValkeyModuleUser *user,
                                                ValkeyModuleString *ch,
                                                int flags);

**Available since:** 7.0.0

Check if the pubsub channel can be accessed by the user based off of the given
access flags. See [`ValkeyModule_ChannelAtPosWithFlags`](#ValkeyModule_ChannelAtPosWithFlags) for more information about the
possible flags that can be passed in.

If the user is able to access the pubsub channel then `VALKEYMODULE_OK` is returned, otherwise
`VALKEYMODULE_ERR` is returned and errno is set to one of the following values:

* EINVAL: The provided flags are invalid.
* EACCESS: The user does not have permission to access the pubsub channel.

<span id="ValkeyModule_ACLAddLogEntry"></span>

### `ValkeyModule_ACLAddLogEntry`

    int ValkeyModule_ACLAddLogEntry(ValkeyModuleCtx *ctx,
                                    ValkeyModuleUser *user,
                                    ValkeyModuleString *object,
                                    ValkeyModuleACLLogEntryReason reason);

**Available since:** 7.0.0

Adds a new entry in the ACL log.
Returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` on error.

For more information about ACL log, please refer to [https://valkey.io/commands/acl-log](https://valkey.io/commands/acl-log)

<span id="ValkeyModule_ACLAddLogEntryByUserName"></span>

### `ValkeyModule_ACLAddLogEntryByUserName`

    int ValkeyModule_ACLAddLogEntryByUserName(ValkeyModuleCtx *ctx,
                                              ValkeyModuleString *username,
                                              ValkeyModuleString *object,
                                              ValkeyModuleACLLogEntryReason reason);

**Available since:** 7.2.0

Adds a new entry in the ACL log with the `username` `ValkeyModuleString` provided.
Returns `VALKEYMODULE_OK` on success and `VALKEYMODULE_ERR` on error.

For more information about ACL log, please refer to [https://valkey.io/commands/acl-log](https://valkey.io/commands/acl-log)

<span id="ValkeyModule_AuthenticateClientWithUser"></span>

### `ValkeyModule_AuthenticateClientWithUser`

    int ValkeyModule_AuthenticateClientWithUser(ValkeyModuleCtx *ctx,
                                                ValkeyModuleUser *module_user,
                                                ValkeyModuleUserChangedFunc callback,
                                                void *privdata,
                                                uint64_t *client_id);

**Available since:** 6.0.0

Authenticate the current context's user with the provided acl user.
Returns `VALKEYMODULE_ERR` if the user is disabled.

See authenticateClientWithUser for information about callback, `client_id`,
and general usage for authentication.

<span id="ValkeyModule_AuthenticateClientWithACLUser"></span>

### `ValkeyModule_AuthenticateClientWithACLUser`

    int ValkeyModule_AuthenticateClientWithACLUser(ValkeyModuleCtx *ctx,
                                                   const char *name,
                                                   size_t len,
                                                   ValkeyModuleUserChangedFunc callback,
                                                   void *privdata,
                                                   uint64_t *client_id);

**Available since:** 6.0.0

Authenticate the current context's user with the provided acl user.
Returns `VALKEYMODULE_ERR` if the user is disabled or the user does not exist.

See authenticateClientWithUser for information about callback, `client_id`,
and general usage for authentication.

<span id="ValkeyModule_DeauthenticateAndCloseClient"></span>

### `ValkeyModule_DeauthenticateAndCloseClient`

    int ValkeyModule_DeauthenticateAndCloseClient(ValkeyModuleCtx *ctx,
                                                  uint64_t client_id);

**Available since:** 6.0.0

Deauthenticate and close the client. The client resources will not be
immediately freed, but will be cleaned up in a background job. This is
the recommended way to deauthenticate a client since most clients can't
handle users becoming deauthenticated. Returns `VALKEYMODULE_ERR` when the
client doesn't exist and `VALKEYMODULE_OK` when the operation was successful.

The client ID is returned from the [`ValkeyModule_AuthenticateClientWithUser`](#ValkeyModule_AuthenticateClientWithUser) and
[`ValkeyModule_AuthenticateClientWithACLUser`](#ValkeyModule_AuthenticateClientWithACLUser) APIs, but can be obtained through
the CLIENT api or through server events.

This function is not thread safe, and must be executed within the context
of a command or thread safe context.

<span id="ValkeyModule_RedactClientCommandArgument"></span>

### `ValkeyModule_RedactClientCommandArgument`

    int ValkeyModule_RedactClientCommandArgument(ValkeyModuleCtx *ctx, int pos);

**Available since:** 7.0.0

Redact the client command argument specified at the given position. Redacted arguments
are obfuscated in user facing commands such as SLOWLOG or MONITOR, as well as
never being written to server logs. This command may be called multiple times on the
same position.

Note that the command name, position 0, can not be redacted.

Returns `VALKEYMODULE_OK` if the argument was redacted and `VALKEYMODULE_ERR` if there
was an invalid parameter passed in or the position is outside the client
argument range.

<span id="ValkeyModule_GetClientCertificate"></span>

### `ValkeyModule_GetClientCertificate`

    ValkeyModuleString *ValkeyModule_GetClientCertificate(ValkeyModuleCtx *ctx,
                                                          uint64_t client_id);

**Available since:** 6.0.9

Return the X.509 client-side certificate used by the client to authenticate
this connection.

The return value is an allocated `ValkeyModuleString` that is a X.509 certificate
encoded in PEM (Base64) format. It should be freed (or auto-freed) by the caller.

A NULL value is returned in the following conditions:

- Connection ID does not exist
- Connection is not a TLS connection
- Connection is a TLS connection but no client certificate was used

<span id="section-modules-dictionary-api"></span>

## Modules Dictionary API

Implements a sorted dictionary (actually backed by a radix tree) with
the usual get / set / del / num-items API, together with an iterator
capable of going back and forth.

<span id="ValkeyModule_CreateDict"></span>

### `ValkeyModule_CreateDict`

    ValkeyModuleDict *ValkeyModule_CreateDict(ValkeyModuleCtx *ctx);

**Available since:** 5.0.0

Create a new dictionary. The 'ctx' pointer can be the current module context
or NULL, depending on what you want. Please follow the following rules:

1. Use a NULL context if you plan to retain a reference to this dictionary
   that will survive the time of the module callback where you created it.
2. Use a NULL context if no context is available at the time you are creating
   the dictionary (of course...).
3. However use the current callback context as 'ctx' argument if the
   dictionary time to live is just limited to the callback scope. In this
   case, if enabled, you can enjoy the automatic memory management that will
   reclaim the dictionary memory, as well as the strings returned by the
   Next / Prev dictionary iterator calls.

<span id="ValkeyModule_FreeDict"></span>

### `ValkeyModule_FreeDict`

    void ValkeyModule_FreeDict(ValkeyModuleCtx *ctx, ValkeyModuleDict *d);

**Available since:** 5.0.0

Free a dictionary created with [`ValkeyModule_CreateDict()`](#ValkeyModule_CreateDict). You need to pass the
context pointer 'ctx' only if the dictionary was created using the
context instead of passing NULL.

<span id="ValkeyModule_DictSize"></span>

### `ValkeyModule_DictSize`

    uint64_t ValkeyModule_DictSize(ValkeyModuleDict *d);

**Available since:** 5.0.0

Return the size of the dictionary (number of keys).

<span id="ValkeyModule_DictSetC"></span>

### `ValkeyModule_DictSetC`

    int ValkeyModule_DictSetC(ValkeyModuleDict *d,
                              void *key,
                              size_t keylen,
                              void *ptr);

**Available since:** 5.0.0

Store the specified key into the dictionary, setting its value to the
pointer 'ptr'. If the key was added with success, since it did not
already exist, `VALKEYMODULE_OK` is returned. Otherwise if the key already
exists the function returns `VALKEYMODULE_ERR`.

<span id="ValkeyModule_DictReplaceC"></span>

### `ValkeyModule_DictReplaceC`

    int ValkeyModule_DictReplaceC(ValkeyModuleDict *d,
                                  void *key,
                                  size_t keylen,
                                  void *ptr);

**Available since:** 5.0.0

Like [`ValkeyModule_DictSetC()`](#ValkeyModule_DictSetC) but will replace the key with the new
value if the key already exists.

<span id="ValkeyModule_DictSet"></span>

### `ValkeyModule_DictSet`

    int ValkeyModule_DictSet(ValkeyModuleDict *d,
                             ValkeyModuleString *key,
                             void *ptr);

**Available since:** 5.0.0

Like [`ValkeyModule_DictSetC()`](#ValkeyModule_DictSetC) but takes the key as a `ValkeyModuleString`.

<span id="ValkeyModule_DictReplace"></span>

### `ValkeyModule_DictReplace`

    int ValkeyModule_DictReplace(ValkeyModuleDict *d,
                                 ValkeyModuleString *key,
                                 void *ptr);

**Available since:** 5.0.0

Like [`ValkeyModule_DictReplaceC()`](#ValkeyModule_DictReplaceC) but takes the key as a `ValkeyModuleString`.

<span id="ValkeyModule_DictGetC"></span>

### `ValkeyModule_DictGetC`

    void *ValkeyModule_DictGetC(ValkeyModuleDict *d,
                                void *key,
                                size_t keylen,
                                int *nokey);

**Available since:** 5.0.0

Return the value stored at the specified key. The function returns NULL
both in the case the key does not exist, or if you actually stored
NULL at key. So, optionally, if the 'nokey' pointer is not NULL, it will
be set by reference to 1 if the key does not exist, or to 0 if the key
exists.

<span id="ValkeyModule_DictGet"></span>

### `ValkeyModule_DictGet`

    void *ValkeyModule_DictGet(ValkeyModuleDict *d,
                               ValkeyModuleString *key,
                               int *nokey);

**Available since:** 5.0.0

Like [`ValkeyModule_DictGetC()`](#ValkeyModule_DictGetC) but takes the key as a `ValkeyModuleString`.

<span id="ValkeyModule_DictDelC"></span>

### `ValkeyModule_DictDelC`

    int ValkeyModule_DictDelC(ValkeyModuleDict *d,
                              void *key,
                              size_t keylen,
                              void *oldval);

**Available since:** 5.0.0

Remove the specified key from the dictionary, returning `VALKEYMODULE_OK` if
the key was found and deleted, or `VALKEYMODULE_ERR` if instead there was
no such key in the dictionary. When the operation is successful, if
'oldval' is not NULL, then '*oldval' is set to the value stored at the
key before it was deleted. Using this feature it is possible to get
a pointer to the value (for instance in order to release it), without
having to call [`ValkeyModule_DictGet()`](#ValkeyModule_DictGet) before deleting the key.

<span id="ValkeyModule_DictDel"></span>

### `ValkeyModule_DictDel`

    int ValkeyModule_DictDel(ValkeyModuleDict *d,
                             ValkeyModuleString *key,
                             void *oldval);

**Available since:** 5.0.0

Like [`ValkeyModule_DictDelC()`](#ValkeyModule_DictDelC) but gets the key as a `ValkeyModuleString`.

<span id="ValkeyModule_DictIteratorStartC"></span>

### `ValkeyModule_DictIteratorStartC`

    ValkeyModuleDictIter *ValkeyModule_DictIteratorStartC(ValkeyModuleDict *d,
                                                          const char *op,
                                                          void *key,
                                                          size_t keylen);

**Available since:** 5.0.0

Return an iterator, setup in order to start iterating from the specified
key by applying the operator 'op', which is just a string specifying the
comparison operator to use in order to seek the first element. The
operators available are:

* `^`   – Seek the first (lexicographically smaller) key.
* `$`   – Seek the last  (lexicographically bigger) key.
* `>`   – Seek the first element greater than the specified key.
* `>=`  – Seek the first element greater or equal than the specified key.
* `<`   – Seek the first element smaller than the specified key.
* `<=`  – Seek the first element smaller or equal than the specified key.
* `==`  – Seek the first element matching exactly the specified key.

Note that for `^` and `$` the passed key is not used, and the user may
just pass NULL with a length of 0.

If the element to start the iteration cannot be seeked based on the
key and operator passed, [`ValkeyModule_DictNext()`](#ValkeyModule_DictNext) / Prev() will just return
`VALKEYMODULE_ERR` at the first call, otherwise they'll produce elements.

<span id="ValkeyModule_DictIteratorStart"></span>

### `ValkeyModule_DictIteratorStart`

    ValkeyModuleDictIter *ValkeyModule_DictIteratorStart(ValkeyModuleDict *d,
                                                         const char *op,
                                                         ValkeyModuleString *key);

**Available since:** 5.0.0

Exactly like [`ValkeyModule_DictIteratorStartC`](#ValkeyModule_DictIteratorStartC), but the key is passed as a
`ValkeyModuleString`.

<span id="ValkeyModule_DictIteratorStop"></span>

### `ValkeyModule_DictIteratorStop`

    void ValkeyModule_DictIteratorStop(ValkeyModuleDictIter *di);

**Available since:** 5.0.0

Release the iterator created with [`ValkeyModule_DictIteratorStart()`](#ValkeyModule_DictIteratorStart). This call
is mandatory otherwise a memory leak is introduced in the module.

<span id="ValkeyModule_DictIteratorReseekC"></span>

### `ValkeyModule_DictIteratorReseekC`

    int ValkeyModule_DictIteratorReseekC(ValkeyModuleDictIter *di,
                                         const char *op,
                                         void *key,
                                         size_t keylen);

**Available since:** 5.0.0

After its creation with [`ValkeyModule_DictIteratorStart()`](#ValkeyModule_DictIteratorStart), it is possible to
change the currently selected element of the iterator by using this
API call. The result based on the operator and key is exactly like
the function [`ValkeyModule_DictIteratorStart()`](#ValkeyModule_DictIteratorStart), however in this case the
return value is just `VALKEYMODULE_OK` in case the seeked element was found,
or `VALKEYMODULE_ERR` in case it was not possible to seek the specified
element. It is possible to reseek an iterator as many times as you want.

<span id="ValkeyModule_DictIteratorReseek"></span>

### `ValkeyModule_DictIteratorReseek`

    int ValkeyModule_DictIteratorReseek(ValkeyModuleDictIter *di,
                                        const char *op,
                                        ValkeyModuleString *key);

**Available since:** 5.0.0

Like [`ValkeyModule_DictIteratorReseekC()`](#ValkeyModule_DictIteratorReseekC) but takes the key as a
`ValkeyModuleString`.

<span id="ValkeyModule_DictNextC"></span>

### `ValkeyModule_DictNextC`

    void *ValkeyModule_DictNextC(ValkeyModuleDictIter *di,
                                 size_t *keylen,
                                 void **dataptr);

**Available since:** 5.0.0

Return the current item of the dictionary iterator `di` and steps to the
next element. If the iterator already yield the last element and there
are no other elements to return, NULL is returned, otherwise a pointer
to a string representing the key is provided, and the `*keylen` length
is set by reference (if keylen is not NULL). The `*dataptr`, if not NULL
is set to the value of the pointer stored at the returned key as auxiliary
data (as set by the [`ValkeyModule_DictSet`](#ValkeyModule_DictSet) API).

Usage example:

     ... create the iterator here ...
     char *key;
     void *data;
     while((key = ValkeyModule_DictNextC(iter,&keylen,&data)) != NULL) {
         printf("%.*s %p\n", (int)keylen, key, data);
     }

The returned pointer is of type void because sometimes it makes sense
to cast it to a `char*` sometimes to an unsigned `char*` depending on the
fact it contains or not binary data, so this API ends being more
comfortable to use.

The validity of the returned pointer is until the next call to the
next/prev iterator step. Also the pointer is no longer valid once the
iterator is released.

<span id="ValkeyModule_DictPrevC"></span>

### `ValkeyModule_DictPrevC`

    void *ValkeyModule_DictPrevC(ValkeyModuleDictIter *di,
                                 size_t *keylen,
                                 void **dataptr);

**Available since:** 5.0.0

This function is exactly like [`ValkeyModule_DictNext()`](#ValkeyModule_DictNext) but after returning
the currently selected element in the iterator, it selects the previous
element (lexicographically smaller) instead of the next one.

<span id="ValkeyModule_DictNext"></span>

### `ValkeyModule_DictNext`

    ValkeyModuleString *ValkeyModule_DictNext(ValkeyModuleCtx *ctx,
                                              ValkeyModuleDictIter *di,
                                              void **dataptr);

**Available since:** 5.0.0

Like `ValkeyModuleNextC()`, but instead of returning an internally allocated
buffer and key length, it returns directly a module string object allocated
in the specified context 'ctx' (that may be NULL exactly like for the main
API [`ValkeyModule_CreateString`](#ValkeyModule_CreateString)).

The returned string object should be deallocated after use, either manually
or by using a context that has automatic memory management active.

<span id="ValkeyModule_DictPrev"></span>

### `ValkeyModule_DictPrev`

    ValkeyModuleString *ValkeyModule_DictPrev(ValkeyModuleCtx *ctx,
                                              ValkeyModuleDictIter *di,
                                              void **dataptr);

**Available since:** 5.0.0

Like [`ValkeyModule_DictNext()`](#ValkeyModule_DictNext) but after returning the currently selected
element in the iterator, it selects the previous element (lexicographically
smaller) instead of the next one.

<span id="ValkeyModule_DictCompareC"></span>

### `ValkeyModule_DictCompareC`

    int ValkeyModule_DictCompareC(ValkeyModuleDictIter *di,
                                  const char *op,
                                  void *key,
                                  size_t keylen);

**Available since:** 5.0.0

Compare the element currently pointed by the iterator to the specified
element given by key/keylen, according to the operator 'op' (the set of
valid operators are the same valid for [`ValkeyModule_DictIteratorStart`](#ValkeyModule_DictIteratorStart)).
If the comparison is successful the command returns `VALKEYMODULE_OK`
otherwise `VALKEYMODULE_ERR` is returned.

This is useful when we want to just emit a lexicographical range, so
in the loop, as we iterate elements, we can also check if we are still
on range.

The function return `VALKEYMODULE_ERR` if the iterator reached the
end of elements condition as well.

<span id="ValkeyModule_DictCompare"></span>

### `ValkeyModule_DictCompare`

    int ValkeyModule_DictCompare(ValkeyModuleDictIter *di,
                                 const char *op,
                                 ValkeyModuleString *key);

**Available since:** 5.0.0

Like [`ValkeyModule_DictCompareC`](#ValkeyModule_DictCompareC) but gets the key to compare with the current
iterator key as a `ValkeyModuleString`.

<span id="section-modules-info-fields"></span>

## Modules Info fields

<span id="ValkeyModule_InfoAddSection"></span>

### `ValkeyModule_InfoAddSection`

    int ValkeyModule_InfoAddSection(ValkeyModuleInfoCtx *ctx, const char *name);

**Available since:** 6.0.0

Used to start a new section, before adding any fields. the section name will
be prefixed by `<modulename>_` and must only include A-Z,a-z,0-9.
NULL or empty string indicates the default section (only `<modulename>`) is used.
When return value is `VALKEYMODULE_ERR`, the section should and will be skipped.

<span id="ValkeyModule_InfoBeginDictField"></span>

### `ValkeyModule_InfoBeginDictField`

    int ValkeyModule_InfoBeginDictField(ValkeyModuleInfoCtx *ctx, const char *name);

**Available since:** 6.0.0

Starts a dict field, similar to the ones in INFO KEYSPACE. Use normal
`ValkeyModule_InfoAddField`* functions to add the items to this field, and
terminate with [`ValkeyModule_InfoEndDictField`](#ValkeyModule_InfoEndDictField).

<span id="ValkeyModule_InfoEndDictField"></span>

### `ValkeyModule_InfoEndDictField`

    int ValkeyModule_InfoEndDictField(ValkeyModuleInfoCtx *ctx);

**Available since:** 6.0.0

Ends a dict field, see [`ValkeyModule_InfoBeginDictField`](#ValkeyModule_InfoBeginDictField)

<span id="ValkeyModule_InfoAddFieldString"></span>

### `ValkeyModule_InfoAddFieldString`

    int ValkeyModule_InfoAddFieldString(ValkeyModuleInfoCtx *ctx,
                                        const char *field,
                                        ValkeyModuleString *value);

**Available since:** 6.0.0

Used by `ValkeyModuleInfoFunc` to add info fields.
Each field will be automatically prefixed by `<modulename>_`.
Field names or values must not include `\r\n` or `:`.

<span id="ValkeyModule_InfoAddFieldCString"></span>

### `ValkeyModule_InfoAddFieldCString`

    int ValkeyModule_InfoAddFieldCString(ValkeyModuleInfoCtx *ctx,
                                         const char *field,
                                         const char *value);

**Available since:** 6.0.0

See [`ValkeyModule_InfoAddFieldString()`](#ValkeyModule_InfoAddFieldString).

<span id="ValkeyModule_InfoAddFieldDouble"></span>

### `ValkeyModule_InfoAddFieldDouble`

    int ValkeyModule_InfoAddFieldDouble(ValkeyModuleInfoCtx *ctx,
                                        const char *field,
                                        double value);

**Available since:** 6.0.0

See [`ValkeyModule_InfoAddFieldString()`](#ValkeyModule_InfoAddFieldString).

<span id="ValkeyModule_InfoAddFieldLongLong"></span>

### `ValkeyModule_InfoAddFieldLongLong`

    int ValkeyModule_InfoAddFieldLongLong(ValkeyModuleInfoCtx *ctx,
                                          const char *field,
                                          long long value);

**Available since:** 6.0.0

See [`ValkeyModule_InfoAddFieldString()`](#ValkeyModule_InfoAddFieldString).

<span id="ValkeyModule_InfoAddFieldULongLong"></span>

### `ValkeyModule_InfoAddFieldULongLong`

    int ValkeyModule_InfoAddFieldULongLong(ValkeyModuleInfoCtx *ctx,
                                           const char *field,
                                           unsigned long long value);

**Available since:** 6.0.0

See [`ValkeyModule_InfoAddFieldString()`](#ValkeyModule_InfoAddFieldString).

<span id="ValkeyModule_RegisterInfoFunc"></span>

### `ValkeyModule_RegisterInfoFunc`

    int ValkeyModule_RegisterInfoFunc(ValkeyModuleCtx *ctx,
                                      ValkeyModuleInfoFunc cb);

**Available since:** 6.0.0

Registers callback for the INFO command. The callback should add INFO fields
by calling the `ValkeyModule_InfoAddField*()` functions.

<span id="ValkeyModule_GetServerInfo"></span>

### `ValkeyModule_GetServerInfo`

    ValkeyModuleServerInfoData *ValkeyModule_GetServerInfo(ValkeyModuleCtx *ctx,
                                                           const char *section);

**Available since:** 6.0.0

Get information about the server similar to the one that returns from the
INFO command. This function takes an optional 'section' argument that may
be NULL. The return value holds the output and can be used with
[`ValkeyModule_ServerInfoGetField`](#ValkeyModule_ServerInfoGetField) and alike to get the individual fields.
When done, it needs to be freed with [`ValkeyModule_FreeServerInfo`](#ValkeyModule_FreeServerInfo) or with the
automatic memory management mechanism if enabled.

<span id="ValkeyModule_FreeServerInfo"></span>

### `ValkeyModule_FreeServerInfo`

    void ValkeyModule_FreeServerInfo(ValkeyModuleCtx *ctx,
                                     ValkeyModuleServerInfoData *data);

**Available since:** 6.0.0

Free data created with [`ValkeyModule_GetServerInfo()`](#ValkeyModule_GetServerInfo). You need to pass the
context pointer 'ctx' only if the dictionary was created using the
context instead of passing NULL.

<span id="ValkeyModule_ServerInfoGetField"></span>

### `ValkeyModule_ServerInfoGetField`

    ValkeyModuleString *ValkeyModule_ServerInfoGetField(ValkeyModuleCtx *ctx,
                                                        ValkeyModuleServerInfoData *data,
                                                        const char *field);

**Available since:** 6.0.0

Get the value of a field from data collected with [`ValkeyModule_GetServerInfo()`](#ValkeyModule_GetServerInfo). You
need to pass the context pointer 'ctx' only if you want to use auto memory
mechanism to release the returned string. Return value will be NULL if the
field was not found.

<span id="ValkeyModule_ServerInfoGetFieldC"></span>

### `ValkeyModule_ServerInfoGetFieldC`

    const char *ValkeyModule_ServerInfoGetFieldC(ValkeyModuleServerInfoData *data,
                                                 const char *field);

**Available since:** 6.0.0

Similar to [`ValkeyModule_ServerInfoGetField`](#ValkeyModule_ServerInfoGetField), but returns a char* which should not be freed but the caller.

<span id="ValkeyModule_ServerInfoGetFieldSigned"></span>

### `ValkeyModule_ServerInfoGetFieldSigned`

    long long ValkeyModule_ServerInfoGetFieldSigned(ValkeyModuleServerInfoData *data,
                                                    const char *field,
                                                    int *out_err);

**Available since:** 6.0.0

Get the value of a field from data collected with [`ValkeyModule_GetServerInfo()`](#ValkeyModule_GetServerInfo). If the
field is not found, or is not numerical or out of range, return value will be
0, and the optional `out_err` argument will be set to `VALKEYMODULE_ERR`.

<span id="ValkeyModule_ServerInfoGetFieldUnsigned"></span>

### `ValkeyModule_ServerInfoGetFieldUnsigned`

    unsigned long long ValkeyModule_ServerInfoGetFieldUnsigned(ValkeyModuleServerInfoData *data,
                                                               const char *field,
                                                               int *out_err);

**Available since:** 6.0.0

Get the value of a field from data collected with [`ValkeyModule_GetServerInfo()`](#ValkeyModule_GetServerInfo). If the
field is not found, or is not numerical or out of range, return value will be
0, and the optional `out_err` argument will be set to `VALKEYMODULE_ERR`.

<span id="ValkeyModule_ServerInfoGetFieldDouble"></span>

### `ValkeyModule_ServerInfoGetFieldDouble`

    double ValkeyModule_ServerInfoGetFieldDouble(ValkeyModuleServerInfoData *data,
                                                 const char *field,
                                                 int *out_err);

**Available since:** 6.0.0

Get the value of a field from data collected with [`ValkeyModule_GetServerInfo()`](#ValkeyModule_GetServerInfo). If the
field is not found, or is not a double, return value will be 0, and the
optional `out_err` argument will be set to `VALKEYMODULE_ERR`.

<span id="section-modules-utility-apis"></span>

## Modules utility APIs

<span id="ValkeyModule_GetRandomBytes"></span>

### `ValkeyModule_GetRandomBytes`

    void ValkeyModule_GetRandomBytes(unsigned char *dst, size_t len);

**Available since:** 5.0.0

Return random bytes using SHA1 in counter mode with a /dev/urandom
initialized seed. This function is fast so can be used to generate
many bytes without any effect on the operating system entropy pool.
Currently this function is not thread safe.

<span id="ValkeyModule_GetRandomHexChars"></span>

### `ValkeyModule_GetRandomHexChars`

    void ValkeyModule_GetRandomHexChars(char *dst, size_t len);

**Available since:** 5.0.0

Like [`ValkeyModule_GetRandomBytes()`](#ValkeyModule_GetRandomBytes) but instead of setting the string to
random bytes the string is set to random characters in the in the
hex charset [0-9a-f].

<span id="section-modules-api-exporting-importing"></span>

## Modules API exporting / importing

<span id="ValkeyModule_ExportSharedAPI"></span>

### `ValkeyModule_ExportSharedAPI`

    int ValkeyModule_ExportSharedAPI(ValkeyModuleCtx *ctx,
                                     const char *apiname,
                                     void *func);

**Available since:** 5.0.4

This function is called by a module in order to export some API with a
given name. Other modules will be able to use this API by calling the
symmetrical function [`ValkeyModule_GetSharedAPI()`](#ValkeyModule_GetSharedAPI) and casting the return value to
the right function pointer.

The function will return `VALKEYMODULE_OK` if the name is not already taken,
otherwise `VALKEYMODULE_ERR` will be returned and no operation will be
performed.

IMPORTANT: the apiname argument should be a string literal with static
lifetime. The API relies on the fact that it will always be valid in
the future.

<span id="ValkeyModule_GetSharedAPI"></span>

### `ValkeyModule_GetSharedAPI`

    void *ValkeyModule_GetSharedAPI(ValkeyModuleCtx *ctx, const char *apiname);

**Available since:** 5.0.4

Request an exported API pointer. The return value is just a void pointer
that the caller of this function will be required to cast to the right
function pointer, so this is a private contract between modules.

If the requested API is not available then NULL is returned. Because
modules can be loaded at different times with different order, this
function calls should be put inside some module generic API registering
step, that is called every time a module attempts to execute a
command that requires external APIs: if some API cannot be resolved, the
command should return an error.

Here is an example:

    int ... myCommandImplementation(void) {
       if (getExternalAPIs() == 0) {
            reply with an error here if we cannot have the APIs
       }
       // Use the API:
       myFunctionPointer(foo);
    }

And the function registerAPI() is:

    int getExternalAPIs(void) {
        static int api_loaded = 0;
        if (api_loaded != 0) return 1; // APIs already resolved.

        myFunctionPointer = ValkeyModule_GetSharedAPI("...");
        if (myFunctionPointer == NULL) return 0;

        return 1;
    }

<span id="section-module-command-filter-api"></span>

## Module Command Filter API

<span id="ValkeyModule_RegisterCommandFilter"></span>

### `ValkeyModule_RegisterCommandFilter`

    ValkeyModuleCommandFilter *ValkeyModule_RegisterCommandFilter(ValkeyModuleCtx *ctx,
                                                                  ValkeyModuleCommandFilterFunc callback,
                                                                  int flags);

**Available since:** 5.0.5

Register a new command filter function.

Command filtering makes it possible for modules to extend the server by plugging
into the execution flow of all commands.

A registered filter gets called before the server executes *any* command.  This
includes both core server commands and commands registered by any module.  The
filter applies in all execution paths including:

1. Invocation by a client.
2. Invocation through [`ValkeyModule_Call()`](#ValkeyModule_Call) by any module.
3. Invocation through Lua `server.call()`.
4. Replication of a command from a primary.

The filter executes in a special filter context, which is different and more
limited than a `ValkeyModuleCtx`.  Because the filter affects any command, it
must be implemented in a very efficient way to reduce the performance impact
on the server.  All Module API calls that require a valid context (such as
[`ValkeyModule_Call()`](#ValkeyModule_Call), [`ValkeyModule_OpenKey()`](#ValkeyModule_OpenKey), etc.) are not supported in a
filter context.

The `ValkeyModuleCommandFilterCtx` can be used to inspect or modify the
executed command and its arguments.  As the filter executes before the server
begins processing the command, any change will affect the way the command is
processed.  For example, a module can override server commands this way:

1. Register a `MODULE.SET` command which implements an extended version of
   the `SET` command.
2. Register a command filter which detects invocation of `SET` on a specific
   pattern of keys.  Once detected, the filter will replace the first
   argument from `SET` to `MODULE.SET`.
3. When filter execution is complete, the server considers the new command name
   and therefore executes the module's own command.

Note that in the above use case, if `MODULE.SET` itself uses
[`ValkeyModule_Call()`](#ValkeyModule_Call) the filter will be applied on that call as well.  If
that is not desired, the `VALKEYMODULE_CMDFILTER_NOSELF` flag can be set when
registering the filter.

The `VALKEYMODULE_CMDFILTER_NOSELF` flag prevents execution flows that
originate from the module's own [`ValkeyModule_Call()`](#ValkeyModule_Call) from reaching the filter.  This
flag is effective for all execution flows, including nested ones, as long as
the execution begins from the module's command context or a thread-safe
context that is associated with a blocking command.

Detached thread-safe contexts are *not* associated with the module and cannot
be protected by this flag.

If multiple filters are registered (by the same or different modules), they
are executed in the order of registration.

<span id="ValkeyModule_UnregisterCommandFilter"></span>

### `ValkeyModule_UnregisterCommandFilter`

    int ValkeyModule_UnregisterCommandFilter(ValkeyModuleCtx *ctx,
                                             ValkeyModuleCommandFilter *filter);

**Available since:** 5.0.5

Unregister a command filter.

<span id="ValkeyModule_CommandFilterArgsCount"></span>

### `ValkeyModule_CommandFilterArgsCount`

    int ValkeyModule_CommandFilterArgsCount(ValkeyModuleCommandFilterCtx *fctx);

**Available since:** 5.0.5

Return the number of arguments a filtered command has.  The number of
arguments include the command itself.

<span id="ValkeyModule_CommandFilterArgGet"></span>

### `ValkeyModule_CommandFilterArgGet`

    ValkeyModuleString *ValkeyModule_CommandFilterArgGet(ValkeyModuleCommandFilterCtx *fctx,
                                                         int pos);

**Available since:** 5.0.5

Return the specified command argument.  The first argument (position 0) is
the command itself, and the rest are user-provided args.

<span id="ValkeyModule_CommandFilterArgInsert"></span>

### `ValkeyModule_CommandFilterArgInsert`

    int ValkeyModule_CommandFilterArgInsert(ValkeyModuleCommandFilterCtx *fctx,
                                            int pos,
                                            ValkeyModuleString *arg);

**Available since:** 5.0.5

Modify the filtered command by inserting a new argument at the specified
position.  The specified `ValkeyModuleString` argument may be used by the server
after the filter context is destroyed, so it must not be auto-memory
allocated, freed or used elsewhere.

<span id="ValkeyModule_CommandFilterArgReplace"></span>

### `ValkeyModule_CommandFilterArgReplace`

    int ValkeyModule_CommandFilterArgReplace(ValkeyModuleCommandFilterCtx *fctx,
                                             int pos,
                                             ValkeyModuleString *arg);

**Available since:** 5.0.5

Modify the filtered command by replacing an existing argument with a new one.
The specified `ValkeyModuleString` argument may be used by the server after the
filter context is destroyed, so it must not be auto-memory allocated, freed
or used elsewhere.

<span id="ValkeyModule_CommandFilterArgDelete"></span>

### `ValkeyModule_CommandFilterArgDelete`

    int ValkeyModule_CommandFilterArgDelete(ValkeyModuleCommandFilterCtx *fctx,
                                            int pos);

**Available since:** 5.0.5

Modify the filtered command by deleting an argument at the specified
position.

<span id="ValkeyModule_CommandFilterGetClientId"></span>

### `ValkeyModule_CommandFilterGetClientId`

    unsigned long long ValkeyModule_CommandFilterGetClientId(ValkeyModuleCommandFilterCtx *fctx);

**Available since:** 7.2.0

Get Client ID for client that issued the command we are filtering

<span id="ValkeyModule_MallocSize"></span>

### `ValkeyModule_MallocSize`

    size_t ValkeyModule_MallocSize(void *ptr);

**Available since:** 6.0.0

For a given pointer allocated via [`ValkeyModule_Alloc()`](#ValkeyModule_Alloc) or
[`ValkeyModule_Realloc()`](#ValkeyModule_Realloc), return the amount of memory allocated for it.
Note that this may be different (larger) than the memory we allocated
with the allocation calls, since sometimes the underlying allocator
will allocate more memory.

<span id="ValkeyModule_MallocUsableSize"></span>

### `ValkeyModule_MallocUsableSize`

    size_t ValkeyModule_MallocUsableSize(void *ptr);

**Available since:** 7.0.1

Similar to [`ValkeyModule_MallocSize`](#ValkeyModule_MallocSize), the difference is that [`ValkeyModule_MallocUsableSize`](#ValkeyModule_MallocUsableSize)
returns the usable size of memory by the module.

<span id="ValkeyModule_MallocSizeString"></span>

### `ValkeyModule_MallocSizeString`

    size_t ValkeyModule_MallocSizeString(ValkeyModuleString *str);

**Available since:** 7.0.0

Same as [`ValkeyModule_MallocSize`](#ValkeyModule_MallocSize), except it works on `ValkeyModuleString` pointers.

<span id="ValkeyModule_MallocSizeDict"></span>

### `ValkeyModule_MallocSizeDict`

    size_t ValkeyModule_MallocSizeDict(ValkeyModuleDict *dict);

**Available since:** 7.0.0

Same as [`ValkeyModule_MallocSize`](#ValkeyModule_MallocSize), except it works on `ValkeyModuleDict` pointers.
Note that the returned value is only the overhead of the underlying structures,
it does not include the allocation size of the keys and values.

<span id="ValkeyModule_GetUsedMemoryRatio"></span>

### `ValkeyModule_GetUsedMemoryRatio`

    float ValkeyModule_GetUsedMemoryRatio(void);

**Available since:** 6.0.0

Return the a number between 0 to 1 indicating the amount of memory
currently used, relative to the server "maxmemory" configuration.

* 0 - No memory limit configured.
* Between 0 and 1 - The percentage of the memory used normalized in 0-1 range.
* Exactly 1 - Memory limit reached.
* Greater 1 - More memory used than the configured limit.

<span id="section-scanning-keyspace-and-hashes"></span>

## Scanning keyspace and hashes

<span id="ValkeyModule_ScanCursorCreate"></span>

### `ValkeyModule_ScanCursorCreate`

    ValkeyModuleScanCursor *ValkeyModule_ScanCursorCreate(void);

**Available since:** 6.0.0

Create a new cursor to be used with [`ValkeyModule_Scan`](#ValkeyModule_Scan)

<span id="ValkeyModule_ScanCursorRestart"></span>

### `ValkeyModule_ScanCursorRestart`

    void ValkeyModule_ScanCursorRestart(ValkeyModuleScanCursor *cursor);

**Available since:** 6.0.0

Restart an existing cursor. The keys will be rescanned.

<span id="ValkeyModule_ScanCursorDestroy"></span>

### `ValkeyModule_ScanCursorDestroy`

    void ValkeyModule_ScanCursorDestroy(ValkeyModuleScanCursor *cursor);

**Available since:** 6.0.0

Destroy the cursor struct.

<span id="ValkeyModule_Scan"></span>

### `ValkeyModule_Scan`

    int ValkeyModule_Scan(ValkeyModuleCtx *ctx,
                          ValkeyModuleScanCursor *cursor,
                          ValkeyModuleScanCB fn,
                          void *privdata);

**Available since:** 6.0.0

Scan API that allows a module to scan all the keys and value in
the selected db.

Callback for scan implementation.

    void scan_callback(ValkeyModuleCtx *ctx, ValkeyModuleString *keyname,
                       ValkeyModuleKey *key, void *privdata);

- `ctx`: the module context provided to for the scan.
- `keyname`: owned by the caller and need to be retained if used after this
  function.
- `key`: holds info on the key and value, it is provided as best effort, in
  some cases it might be NULL, in which case the user should (can) use
  [`ValkeyModule_OpenKey()`](#ValkeyModule_OpenKey) (and CloseKey too).
  when it is provided, it is owned by the caller and will be free when the
  callback returns.
- `privdata`: the user data provided to [`ValkeyModule_Scan()`](#ValkeyModule_Scan).

The way it should be used:

     ValkeyModuleScanCursor *c = ValkeyModule_ScanCursorCreate();
     while(ValkeyModule_Scan(ctx, c, callback, privateData));
     ValkeyModule_ScanCursorDestroy(c);

It is also possible to use this API from another thread while the lock
is acquired during the actual call to [`ValkeyModule_Scan`](#ValkeyModule_Scan):

     ValkeyModuleScanCursor *c = ValkeyModule_ScanCursorCreate();
     ValkeyModule_ThreadSafeContextLock(ctx);
     while(ValkeyModule_Scan(ctx, c, callback, privateData)){
         ValkeyModule_ThreadSafeContextUnlock(ctx);
         // do some background job
         ValkeyModule_ThreadSafeContextLock(ctx);
     }
     ValkeyModule_ScanCursorDestroy(c);

The function will return 1 if there are more elements to scan and
0 otherwise, possibly setting errno if the call failed.

It is also possible to restart an existing cursor using [`ValkeyModule_ScanCursorRestart`](#ValkeyModule_ScanCursorRestart).

IMPORTANT: This API is very similar to the SCAN command from the
point of view of the guarantees it provides. This means that the API
may report duplicated keys, but guarantees to report at least one time
every key that was there from the start to the end of the scanning process.

NOTE: If you do database changes within the callback, you should be aware
that the internal state of the database may change. For instance it is safe
to delete or modify the current key, but may not be safe to delete any
other key.
Moreover playing with the keyspace while iterating may have the
effect of returning more duplicates. A safe pattern is to store the keys
names you want to modify elsewhere, and perform the actions on the keys
later when the iteration is complete. However this can cost a lot of
memory, so it may make sense to just operate on the current key when
possible during the iteration, given that this is safe.

<span id="ValkeyModule_ScanKey"></span>

### `ValkeyModule_ScanKey`

    int ValkeyModule_ScanKey(ValkeyModuleKey *key,
                             ValkeyModuleScanCursor *cursor,
                             ValkeyModuleScanKeyCB fn,
                             void *privdata);

**Available since:** 6.0.0

Scan api that allows a module to scan the elements in a hash, set or sorted set key

Callback for scan implementation.

    void scan_callback(ValkeyModuleKey *key, ValkeyModuleString* field, ValkeyModuleString* value, void *privdata);

- key - the key context provided to for the scan.
- field - field name, owned by the caller and need to be retained if used
  after this function.
- value - value string or NULL for set type, owned by the caller and need to
  be retained if used after this function.
- privdata - the user data provided to [`ValkeyModule_ScanKey`](#ValkeyModule_ScanKey).

The way it should be used:

     ValkeyModuleScanCursor *c = ValkeyModule_ScanCursorCreate();
     ValkeyModuleKey *key = ValkeyModule_OpenKey(...)
     while(ValkeyModule_ScanKey(key, c, callback, privateData));
     ValkeyModule_CloseKey(key);
     ValkeyModule_ScanCursorDestroy(c);

It is also possible to use this API from another thread while the lock is acquired during
the actual call to [`ValkeyModule_ScanKey`](#ValkeyModule_ScanKey), and re-opening the key each time:

     ValkeyModuleScanCursor *c = ValkeyModule_ScanCursorCreate();
     ValkeyModule_ThreadSafeContextLock(ctx);
     ValkeyModuleKey *key = ValkeyModule_OpenKey(...)
     while(ValkeyModule_ScanKey(ctx, c, callback, privateData)){
         ValkeyModule_CloseKey(key);
         ValkeyModule_ThreadSafeContextUnlock(ctx);
         // do some background job
         ValkeyModule_ThreadSafeContextLock(ctx);
         ValkeyModuleKey *key = ValkeyModule_OpenKey(...)
     }
     ValkeyModule_CloseKey(key);
     ValkeyModule_ScanCursorDestroy(c);

The function will return 1 if there are more elements to scan and 0 otherwise,
possibly setting errno if the call failed.
It is also possible to restart an existing cursor using [`ValkeyModule_ScanCursorRestart`](#ValkeyModule_ScanCursorRestart).

NOTE: Certain operations are unsafe while iterating the object. For instance
while the API guarantees to return at least one time all the elements that
are present in the data structure consistently from the start to the end
of the iteration (see HSCAN and similar commands documentation), the more
you play with the elements, the more duplicates you may get. In general
deleting the current element of the data structure is safe, while removing
the key you are iterating is not safe.

<span id="section-module-fork-api"></span>

## Module fork API

<span id="ValkeyModule_Fork"></span>

### `ValkeyModule_Fork`

    int ValkeyModule_Fork(ValkeyModuleForkDoneHandler cb, void *user_data);

**Available since:** 6.0.0

Create a background child process with the current frozen snapshot of the
main process where you can do some processing in the background without
affecting / freezing the traffic and no need for threads and GIL locking.
Note that the server allows for only one concurrent fork.
When the child wants to exit, it should call [`ValkeyModule_ExitFromChild`](#ValkeyModule_ExitFromChild).
If the parent wants to kill the child it should call [`ValkeyModule_KillForkChild`](#ValkeyModule_KillForkChild)
The done handler callback will be executed on the parent process when the
child existed (but not when killed)
Return: -1 on failure, on success the parent process will get a positive PID
of the child, and the child process will get 0.

<span id="ValkeyModule_SendChildHeartbeat"></span>

### `ValkeyModule_SendChildHeartbeat`

    void ValkeyModule_SendChildHeartbeat(double progress);

**Available since:** 6.2.0

The module is advised to call this function from the fork child once in a while,
so that it can report progress and COW memory to the parent which will be
reported in INFO.
The `progress` argument should between 0 and 1, or -1 when not available.

<span id="ValkeyModule_ExitFromChild"></span>

### `ValkeyModule_ExitFromChild`

    int ValkeyModule_ExitFromChild(int retcode);

**Available since:** 6.0.0

Call from the child process when you want to terminate it.
retcode will be provided to the done handler executed on the parent process.

<span id="ValkeyModule_KillForkChild"></span>

### `ValkeyModule_KillForkChild`

    int ValkeyModule_KillForkChild(int child_pid);

**Available since:** 6.0.0

Can be used to kill the forked child process from the parent process.
`child_pid` would be the return value of [`ValkeyModule_Fork`](#ValkeyModule_Fork).

<span id="section-server-hooks-implementation"></span>

## Server hooks implementation

<span id="ValkeyModule_SubscribeToServerEvent"></span>

### `ValkeyModule_SubscribeToServerEvent`

    int ValkeyModule_SubscribeToServerEvent(ValkeyModuleCtx *ctx,
                                            ValkeyModuleEvent event,
                                            ValkeyModuleEventCallback callback);

**Available since:** 6.0.0

Register to be notified, via a callback, when the specified server event
happens. The callback is called with the event as argument, and an additional
argument which is a void pointer and should be cased to a specific type
that is event-specific (but many events will just use NULL since they do not
have additional information to pass to the callback).

If the callback is NULL and there was a previous subscription, the module
will be unsubscribed. If there was a previous subscription and the callback
is not null, the old callback will be replaced with the new one.

The callback must be of this type:

    int (*ValkeyModuleEventCallback)(ValkeyModuleCtx *ctx,
                                    ValkeyModuleEvent eid,
                                    uint64_t subevent,
                                    void *data);

The 'ctx' is a normal module context that the callback can use in
order to call other modules APIs. The 'eid' is the event itself, this
is only useful in the case the module subscribed to multiple events: using
the 'id' field of this structure it is possible to check if the event
is one of the events we registered with this callback. The 'subevent' field
depends on the event that fired.

Finally the 'data' pointer may be populated, only for certain events, with
more relevant data.

Here is a list of events you can use as 'eid' and related sub events:

* `ValkeyModuleEvent_ReplicationRoleChanged`:

    This event is called when the instance switches from primary
    to replica or the other way around, however the event is
    also called when the replica remains a replica but starts to
    replicate with a different primary.

    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_REPLROLECHANGED_NOW_PRIMARY`
    * `VALKEYMODULE_SUBEVENT_REPLROLECHANGED_NOW_REPLICA`

    The 'data' field can be casted by the callback to a
    `ValkeyModuleReplicationInfo` structure with the following fields:

        int primary; // true if primary, false if replica
        char *primary_host; // primary instance hostname for NOW_REPLICA
        int primary_port; // primary instance port for NOW_REPLICA
        char *replid1; // Main replication ID
        char *replid2; // Secondary replication ID
        uint64_t repl1_offset; // Main replication offset
        uint64_t repl2_offset; // Offset of replid2 validity

* `ValkeyModuleEvent_Persistence`

    This event is called when RDB saving or AOF rewriting starts
    and ends. The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_PERSISTENCE_RDB_START`
    * `VALKEYMODULE_SUBEVENT_PERSISTENCE_AOF_START`
    * `VALKEYMODULE_SUBEVENT_PERSISTENCE_SYNC_RDB_START`
    * `VALKEYMODULE_SUBEVENT_PERSISTENCE_SYNC_AOF_START`
    * `VALKEYMODULE_SUBEVENT_PERSISTENCE_ENDED`
    * `VALKEYMODULE_SUBEVENT_PERSISTENCE_FAILED`

    The above events are triggered not just when the user calls the
    relevant commands like BGSAVE, but also when a saving operation
    or AOF rewriting occurs because of internal server triggers.
    The SYNC_RDB_START sub events are happening in the foreground due to
    SAVE command, FLUSHALL, or server shutdown, and the other RDB and
    AOF sub events are executed in a background fork child, so any
    action the module takes can only affect the generated AOF or RDB,
    but will not be reflected in the parent process and affect connected
    clients and commands. Also note that the AOF_START sub event may end
    up saving RDB content in case of an AOF with rdb-preamble.

* `ValkeyModuleEvent_FlushDB`

    The FLUSHALL, FLUSHDB or an internal flush (for instance
    because of replication, after the replica synchronization)
    happened. The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_FLUSHDB_START`
    * `VALKEYMODULE_SUBEVENT_FLUSHDB_END`

    The data pointer can be casted to a ValkeyModuleFlushInfo
    structure with the following fields:

        int32_t async;  // True if the flush is done in a thread.
                        // See for instance FLUSHALL ASYNC.
                        // In this case the END callback is invoked
                        // immediately after the database is put
                        // in the free list of the thread.
        int32_t dbnum;  // Flushed database number, -1 for all the DBs
                        // in the case of the FLUSHALL operation.

    The start event is called *before* the operation is initiated, thus
    allowing the callback to call DBSIZE or other operation on the
    yet-to-free keyspace.

* `ValkeyModuleEvent_Loading`

    Called on loading operations: at startup when the server is
    started, but also after a first synchronization when the
    replica is loading the RDB file from the primary.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_LOADING_RDB_START`
    * `VALKEYMODULE_SUBEVENT_LOADING_AOF_START`
    * `VALKEYMODULE_SUBEVENT_LOADING_REPL_START`
    * `VALKEYMODULE_SUBEVENT_LOADING_ENDED`
    * `VALKEYMODULE_SUBEVENT_LOADING_FAILED`

    Note that AOF loading may start with an RDB data in case of
    rdb-preamble, in which case you'll only receive an AOF_START event.

* `ValkeyModuleEvent_ClientChange`

    Called when a client connects or disconnects.
    The data pointer can be casted to a ValkeyModuleClientInfo
    structure, documented in ValkeyModule_GetClientInfoById().
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_CLIENT_CHANGE_CONNECTED`
    * `VALKEYMODULE_SUBEVENT_CLIENT_CHANGE_DISCONNECTED`

* `ValkeyModuleEvent_Shutdown`

    The server is shutting down. No subevents are available.

* `ValkeyModuleEvent_ReplicaChange`

    This event is called when the instance (that can be both a
    primary or a replica) get a new online replica, or lose a
    replica since it gets disconnected.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_REPLICA_CHANGE_ONLINE`
    * `VALKEYMODULE_SUBEVENT_REPLICA_CHANGE_OFFLINE`

    No additional information is available so far: future versions
    of the server will have an API in order to enumerate the replicas
    connected and their state.

* `ValkeyModuleEvent_CronLoop`

    This event is called every time the server calls the serverCron()
    function in order to do certain bookkeeping. Modules that are
    required to do operations from time to time may use this callback.
    Normally the server calls this function 10 times per second, but
    this changes depending on the "hz" configuration.
    No sub events are available.

    The data pointer can be casted to a ValkeyModuleCronLoop
    structure with the following fields:

        int32_t hz;  // Approximate number of events per second.

* `ValkeyModuleEvent_PrimaryLinkChange`

    This is called for replicas in order to notify when the
    replication link becomes functional (up) with our primary,
    or when it goes down. Note that the link is not considered
    up when we just connected to the primary, but only if the
    replication is happening correctly.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_PRIMARY_LINK_UP`
    * `VALKEYMODULE_SUBEVENT_PRIMARY_LINK_DOWN`

* `ValkeyModuleEvent_ModuleChange`

    This event is called when a new module is loaded or one is unloaded.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_MODULE_LOADED`
    * `VALKEYMODULE_SUBEVENT_MODULE_UNLOADED`

    The data pointer can be casted to a ValkeyModuleModuleChange
    structure with the following fields:

        const char* module_name;  // Name of module loaded or unloaded.
        int32_t module_version;  // Module version.

* `ValkeyModuleEvent_LoadingProgress`

    This event is called repeatedly called while an RDB or AOF file
    is being loaded.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_LOADING_PROGRESS_RDB`
    * `VALKEYMODULE_SUBEVENT_LOADING_PROGRESS_AOF`

    The data pointer can be casted to a ValkeyModuleLoadingProgress
    structure with the following fields:

        int32_t hz;  // Approximate number of events per second.
        int32_t progress;  // Approximate progress between 0 and 1024,
                           // or -1 if unknown.

* `ValkeyModuleEvent_SwapDB`

    This event is called when a SWAPDB command has been successfully
    Executed.
    For this event call currently there is no subevents available.

    The data pointer can be casted to a ValkeyModuleSwapDbInfo
    structure with the following fields:

        int32_t dbnum_first;    // Swap Db first dbnum
        int32_t dbnum_second;   // Swap Db second dbnum

* `ValkeyModuleEvent_ReplBackup`

    WARNING: Replication Backup events are deprecated since Redis OSS 7.0 and are never fired.
    See ValkeyModuleEvent_ReplAsyncLoad for understanding how Async Replication Loading events
    are now triggered when repl-diskless-load is set to swapdb.

    Called when repl-diskless-load config is set to swapdb,
    And the server needs to backup the current database for the
    possibility to be restored later. A module with global data and
    maybe with aux_load and aux_save callbacks may need to use this
    notification to backup / restore / discard its globals.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_REPL_BACKUP_CREATE`
    * `VALKEYMODULE_SUBEVENT_REPL_BACKUP_RESTORE`
    * `VALKEYMODULE_SUBEVENT_REPL_BACKUP_DISCARD`

* `ValkeyModuleEvent_ReplAsyncLoad`

    Called when repl-diskless-load config is set to swapdb and a replication with a primary of same
    data set history (matching replication ID) occurs.
    In which case the server serves current data set while loading new database in memory from socket.
    Modules must have declared they support this mechanism in order to activate it, through
    VALKEYMODULE_OPTIONS_HANDLE_REPL_ASYNC_LOAD flag.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_REPL_ASYNC_LOAD_STARTED`
    * `VALKEYMODULE_SUBEVENT_REPL_ASYNC_LOAD_ABORTED`
    * `VALKEYMODULE_SUBEVENT_REPL_ASYNC_LOAD_COMPLETED`

* `ValkeyModuleEvent_ForkChild`

    Called when a fork child (AOFRW, RDBSAVE, module fork...) is born/dies
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_FORK_CHILD_BORN`
    * `VALKEYMODULE_SUBEVENT_FORK_CHILD_DIED`

* `ValkeyModuleEvent_EventLoop`

    Called on each event loop iteration, once just before the event loop goes
    to sleep or just after it wakes up.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_EVENTLOOP_BEFORE_SLEEP`
    * `VALKEYMODULE_SUBEVENT_EVENTLOOP_AFTER_SLEEP`

* `ValkeyModuleEvent_Config`

    Called when a configuration event happens
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_CONFIG_CHANGE`

    The data pointer can be casted to a ValkeyModuleConfigChange
    structure with the following fields:

        const char **config_names; // An array of C string pointers containing the
                                   // name of each modified configuration item
        uint32_t num_changes;      // The number of elements in the config_names array

* `ValkeyModuleEvent_Key`

    Called when a key is removed from the keyspace. We can't modify any key in
    the event.
    The following sub events are available:

    * `VALKEYMODULE_SUBEVENT_KEY_DELETED`
    * `VALKEYMODULE_SUBEVENT_KEY_EXPIRED`
    * `VALKEYMODULE_SUBEVENT_KEY_EVICTED`
    * `VALKEYMODULE_SUBEVENT_KEY_OVERWRITTEN`

    The data pointer can be casted to a ValkeyModuleKeyInfo
    structure with the following fields:

        ValkeyModuleKey *key;    // Key name

* `ValkeyModuleEvent_AuthenticationAttempt`

    Called when an authentication attempt is made, either successful or not.

    The data pointer can be casted to a ValkeyModuleAuthenticationInfo
    structure with the following fields:

        uint64_t client_id;      // Client ID.
        const char *username;    // Username used for authentication.
        const char *module_name; // Name of the module that is handling the
                                 // authentication. It is NULL if the
                                 // authentication is handled by the core.
        ValkeyModuleAuthenticationResult result;   // Result of the authentication:
                                                   // VALKEYMODULE_AUTH_RESULT_GRANTED or
                                                   // VALKEYMODULE_AUTH_RESULT_DENIED

* `ValkeyModuleEvent_AtomicSlotMigration`

   Called when an atomic slot migration (CLUSTER MIGRATESLOTS) is started or
   ended in this node. This node may be a target or a source node, or the
   target or source might be this node's primary. The following sub events
   are available:

    * `VALKEYMODULE_SUBEVENT_ATOMIC_SLOT_MIGRATION_IMPORT_STARTED`
    * `VALKEYMODULE_SUBEVENT_ATOMIC_SLOT_MIGRATION_EXPORT_STARTED`
    * `VALKEYMODULE_SUBEVENT_ATOMIC_SLOT_MIGRATION_IMPORT_ABORTED`
    * `VALKEYMODULE_SUBEVENT_ATOMIC_SLOT_MIGRATION_EXPORT_ABORTED`
    * `VALKEYMODULE_SUBEVENT_ATOMIC_SLOT_MIGRATION_IMPORT_COMPLETED`
    * `VALKEYMODULE_SUBEVENT_ATOMIC_SLOT_MIGRATION_EXPORT_COMPLETED`

   The data pointer can be casted to `ValkeyModuleAtomicSlotMigrationInfo`
   structure with the following fields:

        char *job_name;                     // Unique ID for the operation (40 chars)
        ValkeyModuleSlotRange *slot_ranges; // Array of slot ranges involved in the operation
        uint32_t num_slot_ranges;           // Number of slot ranges in slot_ranges array

   The `ValkeyModuleSlotRange` structure has the following fields:

         int start; // First slot in this range, inclusive
         int end;   // Last slot in this range, inclusive

   Modules can use these notifications to track the start and end of slot
   migrations. Slot migrations will start with a STARTED subevent and end
   with a COMPLETED subevent if they are successful and ownership is
   transferred, or an ABORTED subevent if they were not successful and no
   ownership change was made. While a slot migration is active, modules will
   see incoming commands and keyspace notifications for importing keys.
   Importing keys will not be accessible to clients unless the slot migration
   is COMPLETED.

The function returns `VALKEYMODULE_OK` if the module was successfully subscribed
for the specified event. If the API is called from a wrong context or unsupported event
is given then `VALKEYMODULE_ERR` is returned.

<span id="ValkeyModule_IsSubEventSupported"></span>

### `ValkeyModule_IsSubEventSupported`

    int ValkeyModule_IsSubEventSupported(ValkeyModuleEvent event, int64_t subevent);

**Available since:** 6.0.9


For a given server event and subevent, return zero if the
subevent is not supported and non-zero otherwise.

<span id="section-module-configurations-api"></span>

## Module Configurations API

<span id="ValkeyModule_RegisterStringConfig"></span>

### `ValkeyModule_RegisterStringConfig`

    int ValkeyModule_RegisterStringConfig(ValkeyModuleCtx *ctx,
                                          const char *name,
                                          const char *default_val,
                                          unsigned int flags,
                                          ValkeyModuleConfigGetStringFunc getfn,
                                          ValkeyModuleConfigSetStringFunc setfn,
                                          ValkeyModuleConfigApplyFunc applyfn,
                                          void *privdata);

**Available since:** 7.0.0

Create a string config that users can interact with via the server config file,
`CONFIG SET`, `CONFIG GET`, and `CONFIG REWRITE` commands.

The actual config value is owned by the module, and the `getfn`, `setfn` and optional
`applyfn` callbacks that are provided to the server in order to access or manipulate the
value. The `getfn` callback retrieves the value from the module, while the `setfn`
callback provides a value to be stored into the module config.
The optional `applyfn` callback is called after a `CONFIG SET` command modified one or
more configs using the `setfn` callback and can be used to atomically apply a config
after several configs were changed together.
If there are multiple configs with `applyfn` callbacks set by a single `CONFIG SET`
command, they will be deduplicated if their `applyfn` function and `privdata` pointers
are identical, and the callback will only be run once.
Both the `setfn` and `applyfn` can return an error if the provided value is invalid or
cannot be used.
The config also declares a type for the value that is validated by the server and
provided to the module. The config system provides the following types:

* String: Binary safe string data.
* Enum: One of a finite number of string tokens, provided during registration.
* Numeric: 64 bit signed integer, which also supports min and max values.
* Bool: Yes or no value.

The `setfn` callback is expected to return `VALKEYMODULE_OK` when the value is successfully
applied. It can also return `VALKEYMODULE_ERR` if the value can't be applied, and the
*err pointer can be set with a `ValkeyModuleString` error message to provide to the client.
This `ValkeyModuleString` will be freed by the server after returning from the set callback.

All configs are registered with a name, a type, a default value, private data that is made
available in the callbacks, as well as several flags that modify the behavior of the config.
The name must only contain alphanumeric characters or dashes. The supported flags are:

* `VALKEYMODULE_CONFIG_DEFAULT`: The default flags for a config. This creates a config that can be modified after
startup.
* `VALKEYMODULE_CONFIG_IMMUTABLE`: This config can only be provided loading time.
* `VALKEYMODULE_CONFIG_SENSITIVE`: The value stored in this config is redacted from all logging.
* `VALKEYMODULE_CONFIG_HIDDEN`: The name is hidden from `CONFIG GET` with pattern matching.
* `VALKEYMODULE_CONFIG_PROTECTED`: This config will be only be modifiable based off the value of
enable-protected-configs.
* `VALKEYMODULE_CONFIG_DENY_LOADING`: This config is not modifiable while the server is loading data.
* `VALKEYMODULE_CONFIG_MEMORY`: For numeric configs, this config will convert data unit notations into their byte
equivalent.
* `VALKEYMODULE_CONFIG_BITFLAGS`: For enum configs, this config will allow multiple entries to be combined as bit
flags.

Default values are used on startup to set the value if it is not provided via the config file
or command line. Default values are also used to compare to on a config rewrite.

Notes:

 1. On string config sets that the string passed to the set callback will be freed after execution and the module
must retain it.
 2. On string config gets the string will not be consumed and will be valid after execution.

Example implementation:

    ValkeyModuleString *strval;
    int adjustable = 1;
    ValkeyModuleString *getStringConfigCommand(const char *name, void *privdata) {
        return strval;
    }

    int setStringConfigCommand(const char *name, ValkeyModuleString *new, void *privdata, ValkeyModuleString **err) {
       if (adjustable) {
           ValkeyModule_Free(strval);
           ValkeyModule_RetainString(NULL, new);
           strval = new;
           return VALKEYMODULE_OK;
       }
       *err = ValkeyModule_CreateString(NULL, "Not adjustable.", 15);
       return VALKEYMODULE_ERR;
    }
    ...
    ValkeyModule_RegisterStringConfig(ctx, "string", NULL, VALKEYMODULE_CONFIG_DEFAULT, getStringConfigCommand,
setStringConfigCommand, NULL, NULL);

If the registration fails, `VALKEYMODULE_ERR` is returned and one of the following
errno is set:
* EBUSY: Registering the Config outside of `ValkeyModule_OnLoad`.
* EINVAL: The provided flags are invalid for the registration or the name of the config contains invalid characters.
* EALREADY: The provided configuration name is already used.

<span id="ValkeyModule_RegisterBoolConfig"></span>

### `ValkeyModule_RegisterBoolConfig`

    int ValkeyModule_RegisterBoolConfig(ValkeyModuleCtx *ctx,
                                        const char *name,
                                        int default_val,
                                        unsigned int flags,
                                        ValkeyModuleConfigGetBoolFunc getfn,
                                        ValkeyModuleConfigSetBoolFunc setfn,
                                        ValkeyModuleConfigApplyFunc applyfn,
                                        void *privdata);

**Available since:** 7.0.0

Create a bool config that server clients can interact with via the
`CONFIG SET`, `CONFIG GET`, and `CONFIG REWRITE` commands. See
[`ValkeyModule_RegisterStringConfig`](#ValkeyModule_RegisterStringConfig) for detailed information about configs.

<span id="ValkeyModule_RegisterEnumConfig"></span>

### `ValkeyModule_RegisterEnumConfig`

    int ValkeyModule_RegisterEnumConfig(ValkeyModuleCtx *ctx,
                                        const char *name,
                                        int default_val,
                                        unsigned int flags,
                                        const char **enum_values,
                                        const int *int_values,
                                        int num_enum_vals,
                                        ValkeyModuleConfigGetEnumFunc getfn,
                                        ValkeyModuleConfigSetEnumFunc setfn,
                                        ValkeyModuleConfigApplyFunc applyfn,
                                        void *privdata);

**Available since:** 7.0.0


Create an enum config that server clients can interact with via the
`CONFIG SET`, `CONFIG GET`, and `CONFIG REWRITE` commands.
Enum configs are a set of string tokens to corresponding integer values, where
the string value is exposed to clients but the inter value is passed to the server
and the module. These values are defined in `enum_values`, an array
of null-terminated c strings, and `int_vals`, an array of enum values who has an
index partner in `enum_values`.
Example Implementation:
     const char *enum_vals[3] = {"first", "second", "third"};
     const int int_vals[3] = {0, 2, 4};
     int enum_val = 0;

     int getEnumConfigCommand(const char *name, void *privdata) {
         return enum_val;
     }

     int setEnumConfigCommand(const char *name, int val, void *privdata, const char **err) {
         enum_val = val;
         return VALKEYMODULE_OK;
     }
     ...
     ValkeyModule_RegisterEnumConfig(ctx, "enum", 0, VALKEYMODULE_CONFIG_DEFAULT, enum_vals, int_vals, 3,
getEnumConfigCommand, setEnumConfigCommand, NULL, NULL);

Note that you can use `VALKEYMODULE_CONFIG_BITFLAGS` so that multiple enum string
can be combined into one integer as bit flags, in which case you may want to
sort your enums so that the preferred combinations are present first.

See [`ValkeyModule_RegisterStringConfig`](#ValkeyModule_RegisterStringConfig) for detailed general information about configs.

<span id="ValkeyModule_RegisterNumericConfig"></span>

### `ValkeyModule_RegisterNumericConfig`

    int ValkeyModule_RegisterNumericConfig(ValkeyModuleCtx *ctx,
                                           const char *name,
                                           long long default_val,
                                           unsigned int flags,
                                           long long min,
                                           long long max,
                                           ValkeyModuleConfigGetNumericFunc getfn,
                                           ValkeyModuleConfigSetNumericFunc setfn,
                                           ValkeyModuleConfigApplyFunc applyfn,
                                           void *privdata);

**Available since:** 7.0.0


Create an integer config that server clients can interact with via the
`CONFIG SET`, `CONFIG GET`, and `CONFIG REWRITE` commands. See
[`ValkeyModule_RegisterStringConfig`](#ValkeyModule_RegisterStringConfig) for detailed information about configs.

<span id="ValkeyModule_LoadConfigs"></span>

### `ValkeyModule_LoadConfigs`

    int ValkeyModule_LoadConfigs(ValkeyModuleCtx *ctx);

**Available since:** 7.0.0

Applies all pending configurations on the module load. This should be called
after all of the configurations have been registered for the module inside of `ValkeyModule_OnLoad`.
This will return `VALKEYMODULE_ERR` if it is called outside `ValkeyModule_OnLoad`.
This API needs to be called when configurations are provided in either `MODULE LOADEX`
or provided as startup arguments.

<span id="section-rdb-load-save-api"></span>

## RDB load/save API

<span id="ValkeyModule_RdbStreamCreateFromFile"></span>

### `ValkeyModule_RdbStreamCreateFromFile`

    ValkeyModuleRdbStream *ValkeyModule_RdbStreamCreateFromFile(const char *filename);

**Available since:** 7.2.0

Create a stream object to save/load RDB to/from a file.

This function returns a pointer to `ValkeyModuleRdbStream` which is owned
by the caller. It requires a call to [`ValkeyModule_RdbStreamFree()`](#ValkeyModule_RdbStreamFree) to free
the object.

<span id="ValkeyModule_RdbStreamFree"></span>

### `ValkeyModule_RdbStreamFree`

    void ValkeyModule_RdbStreamFree(ValkeyModuleRdbStream *stream);

**Available since:** 7.2.0

Release an RDB stream object.

<span id="ValkeyModule_RdbLoad"></span>

### `ValkeyModule_RdbLoad`

    int ValkeyModule_RdbLoad(ValkeyModuleCtx *ctx,
                             ValkeyModuleRdbStream *stream,
                             int flags);

**Available since:** 7.2.0

Load RDB file from the `stream`. Dataset will be cleared first and then RDB
file will be loaded.

`flags` must be zero. This parameter is for future use.

On success `VALKEYMODULE_OK` is returned, otherwise `VALKEYMODULE_ERR` is returned
and errno is set accordingly.

Example:

    ValkeyModuleRdbStream *s = ValkeyModule_RdbStreamCreateFromFile("exp.rdb");
    ValkeyModule_RdbLoad(ctx, s, 0);
    ValkeyModule_RdbStreamFree(s);

<span id="ValkeyModule_RdbSave"></span>

### `ValkeyModule_RdbSave`

    int ValkeyModule_RdbSave(ValkeyModuleCtx *ctx,
                             ValkeyModuleRdbStream *stream,
                             int flags);

**Available since:** 7.2.0

Save dataset to the RDB stream.

`flags` must be zero. This parameter is for future use.

On success `VALKEYMODULE_OK` is returned, otherwise `VALKEYMODULE_ERR` is returned
and errno is set accordingly.

Example:

    ValkeyModuleRdbStream *s = ValkeyModule_RdbStreamCreateFromFile("exp.rdb");
    ValkeyModule_RdbSave(ctx, s, 0);
    ValkeyModule_RdbStreamFree(s);

<span id="ValkeyModule_RegisterScriptingEngine"></span>

### `ValkeyModule_RegisterScriptingEngine`

    int ValkeyModule_RegisterScriptingEngine(ValkeyModuleCtx *module_ctx,
                                             const char *engine_name,
                                             ValkeyModuleScriptingEngineCtx *engine_ctx,
                                             ValkeyModuleScriptingEngineMethods *engine_methods);

**Available since:** 8.1.0

Registers a new scripting engine in the server.

- `module_ctx`: the module context object.

- `engine_name`: the name of the scripting engine. This name will match
  against the engine name specified in the script header using a shebang.

- `engine_ctx`: engine specific context pointer.

- `engine_methods`: the struct with the scripting engine callback functions
  pointers.

Returns `VALKEYMODULE_OK` if the engine is successfully registered, and
`VALKEYMODULE_ERR` in case some failure occurs. In case of a failure, an error
message is logged.

<span id="ValkeyModule_UnregisterScriptingEngine"></span>

### `ValkeyModule_UnregisterScriptingEngine`

    int ValkeyModule_UnregisterScriptingEngine(ValkeyModuleCtx *ctx,
                                               const char *engine_name);

**Available since:** 8.1.0

Removes the scripting engine from the server.

`engine_name` is the name of the scripting engine.

Returns `VALKEYMODULE_OK`.

<span id="ValkeyModule_GetFunctionExecutionState"></span>

### `ValkeyModule_GetFunctionExecutionState`

    ValkeyModuleScriptingEngineExecutionState ValkeyModule_GetFunctionExecutionState( ValkeyModuleScriptingEngineServerRuntimeCtx *server_ctx);

**Available since:** 8.1.0

Returns the state of the current function being executed by the scripting
engine.

`server_ctx` is the server runtime context.

It will return `VMSE_STATE_KILLED` if the function was already killed either by
a `SCRIPT KILL`, or `FUNCTION KILL`.

<span id="section-key-eviction-api"></span>

## Key eviction API

<span id="ValkeyModule_SetLRU"></span>

### `ValkeyModule_SetLRU`

    int ValkeyModule_SetLRU(ValkeyModuleKey *key, mstime_t lru_idle);

**Available since:** 6.0.0

Set the key last access time for LRU based eviction. not relevant if the
servers's maxmemory policy is LFU based. Value is idle time in milliseconds.
returns `VALKEYMODULE_OK` if the LRU was updated, `VALKEYMODULE_ERR` otherwise.

<span id="ValkeyModule_GetLRU"></span>

### `ValkeyModule_GetLRU`

    int ValkeyModule_GetLRU(ValkeyModuleKey *key, mstime_t *lru_idle);

**Available since:** 6.0.0

Gets the key last access time.
Value is idletime in milliseconds or -1 if the server's eviction policy is
LFU based.
returns `VALKEYMODULE_OK` if when key is valid.

<span id="ValkeyModule_SetLFU"></span>

### `ValkeyModule_SetLFU`

    int ValkeyModule_SetLFU(ValkeyModuleKey *key, long long lfu_freq);

**Available since:** 6.0.0

Set the key access frequency. only relevant if the server's maxmemory policy
is LFU based.
The frequency is a logarithmic counter that provides an indication of
the access frequency (must be <= 255).
returns `VALKEYMODULE_OK` if the LFU was updated, `VALKEYMODULE_ERR` otherwise.

<span id="ValkeyModule_GetLFU"></span>

### `ValkeyModule_GetLFU`

    int ValkeyModule_GetLFU(ValkeyModuleKey *key, long long *lfu_freq);

**Available since:** 6.0.0

Gets the key access frequency or -1 if the server's eviction policy is not
LFU based.
returns `VALKEYMODULE_OK` if when key is valid.

<span id="section-miscellaneous-apis"></span>

## Miscellaneous APIs

<span id="ValkeyModule_GetModuleOptionsAll"></span>

### `ValkeyModule_GetModuleOptionsAll`

    int ValkeyModule_GetModuleOptionsAll(void);

**Available since:** 7.2.0


Returns the full module options flags mask, using the return value
the module can check if a certain set of module options are supported
by the server version in use.
Example:

       int supportedFlags = ValkeyModule_GetModuleOptionsAll();
       if (supportedFlags & VALKEYMODULE_OPTIONS_ALLOW_NESTED_KEYSPACE_NOTIFICATIONS) {
             // VALKEYMODULE_OPTIONS_ALLOW_NESTED_KEYSPACE_NOTIFICATIONS is supported
       } else{
             // VALKEYMODULE_OPTIONS_ALLOW_NESTED_KEYSPACE_NOTIFICATIONS is not supported
       }

<span id="ValkeyModule_GetContextFlagsAll"></span>

### `ValkeyModule_GetContextFlagsAll`

    int ValkeyModule_GetContextFlagsAll(void);

**Available since:** 6.0.9


Returns the full ContextFlags mask, using the return value
the module can check if a certain set of flags are supported
by the server version in use.
Example:

       int supportedFlags = ValkeyModule_GetContextFlagsAll();
       if (supportedFlags & VALKEYMODULE_CTX_FLAGS_MULTI) {
             // VALKEYMODULE_CTX_FLAGS_MULTI is supported
       } else{
             // VALKEYMODULE_CTX_FLAGS_MULTI is not supported
       }

<span id="ValkeyModule_GetKeyspaceNotificationFlagsAll"></span>

### `ValkeyModule_GetKeyspaceNotificationFlagsAll`

    int ValkeyModule_GetKeyspaceNotificationFlagsAll(void);

**Available since:** 6.0.9


Returns the full KeyspaceNotification mask, using the return value
the module can check if a certain set of flags are supported
by the server version in use.
Example:

       int supportedFlags = ValkeyModule_GetKeyspaceNotificationFlagsAll();
       if (supportedFlags & VALKEYMODULE_NOTIFY_LOADED) {
             // VALKEYMODULE_NOTIFY_LOADED is supported
       } else{
             // VALKEYMODULE_NOTIFY_LOADED is not supported
       }

<span id="ValkeyModule_GetServerVersion"></span>

### `ValkeyModule_GetServerVersion`

    int ValkeyModule_GetServerVersion(void);

**Available since:** 6.0.9


Return the server version in format of 0x00MMmmpp.
Example for 6.0.7 the return value will be 0x00060007.

<span id="ValkeyModule_GetTypeMethodVersion"></span>

### `ValkeyModule_GetTypeMethodVersion`

    int ValkeyModule_GetTypeMethodVersion(void);

**Available since:** 6.2.0


Return the current server runtime value of `VALKEYMODULE_TYPE_METHOD_VERSION`.
You can use that when calling [`ValkeyModule_CreateDataType`](#ValkeyModule_CreateDataType) to know which fields of
`ValkeyModuleTypeMethods` are gonna be supported and which will be ignored.

<span id="ValkeyModule_ModuleTypeReplaceValue"></span>

### `ValkeyModule_ModuleTypeReplaceValue`

    int ValkeyModule_ModuleTypeReplaceValue(ValkeyModuleKey *key,
                                            moduleType *mt,
                                            void *new_value,
                                            void **old_value);

**Available since:** 6.0.0

Replace the value assigned to a module type.

The key must be open for writing, have an existing value, and have a moduleType
that matches the one specified by the caller.

Unlike [`ValkeyModule_ModuleTypeSetValue()`](#ValkeyModule_ModuleTypeSetValue) which will free the old value, this function
simply swaps the old value with the new value.

The function returns `VALKEYMODULE_OK` on success, `VALKEYMODULE_ERR` on errors
such as:

1. Key is not opened for writing.
2. Key is not a module data type key.
3. Key is a module datatype other than 'mt'.

If `old_value` is non-NULL, the old value is returned by reference.

<span id="ValkeyModule_GetCommandKeysWithFlags"></span>

### `ValkeyModule_GetCommandKeysWithFlags`

    int *ValkeyModule_GetCommandKeysWithFlags(ValkeyModuleCtx *ctx,
                                              ValkeyModuleString **argv,
                                              int argc,
                                              int *num_keys,
                                              int **out_flags);

**Available since:** 7.0.0

For a specified command, parse its arguments and return an array that
contains the indexes of all key name arguments. This function is
essentially a more efficient way to do `COMMAND GETKEYS`.

The `out_flags` argument is optional, and can be set to NULL.
When provided it is filled with `VALKEYMODULE_CMD_KEY_` flags in matching
indexes with the key indexes of the returned array.

A NULL return value indicates the specified command has no keys, or
an error condition. Error conditions are indicated by setting errno
as follows:

* ENOENT: Specified command does not exist.
* EINVAL: Invalid command arity specified.

NOTE: The returned array is not a Module object so it does not
get automatically freed even when auto-memory is used. The caller
must explicitly call [`ValkeyModule_Free()`](#ValkeyModule_Free) to free it, same as the `out_flags` pointer if
used.

<span id="ValkeyModule_GetCommandKeys"></span>

### `ValkeyModule_GetCommandKeys`

    int *ValkeyModule_GetCommandKeys(ValkeyModuleCtx *ctx,
                                     ValkeyModuleString **argv,
                                     int argc,
                                     int *num_keys);

**Available since:** 6.0.9

Identical to [`ValkeyModule_GetCommandKeysWithFlags`](#ValkeyModule_GetCommandKeysWithFlags) when flags are not needed.

<span id="ValkeyModule_GetCurrentCommandName"></span>

### `ValkeyModule_GetCurrentCommandName`

    const char *ValkeyModule_GetCurrentCommandName(ValkeyModuleCtx *ctx);

**Available since:** 6.2.5

Return the name of the command currently running

<span id="section-defrag-api"></span>

## Defrag API

<span id="ValkeyModule_RegisterDefragFunc"></span>

### `ValkeyModule_RegisterDefragFunc`

    int ValkeyModule_RegisterDefragFunc(ValkeyModuleCtx *ctx,
                                        ValkeyModuleDefragFunc cb);

**Available since:** 6.2.0

Register a defrag callback for global data, i.e. anything that the module
may allocate that is not tied to a specific data type.

<span id="ValkeyModule_DefragShouldStop"></span>

### `ValkeyModule_DefragShouldStop`

    int ValkeyModule_DefragShouldStop(ValkeyModuleDefragCtx *ctx);

**Available since:** 6.2.0

When the data type defrag callback iterates complex structures, this
function should be called periodically. A zero (false) return
indicates the callback may continue its work. A non-zero value (true)
indicates it should stop.

When stopped, the callback may use [`ValkeyModule_DefragCursorSet()`](#ValkeyModule_DefragCursorSet) to store its
position so it can later use [`ValkeyModule_DefragCursorGet()`](#ValkeyModule_DefragCursorGet) to resume defragging.

When stopped and more work is left to be done, the callback should
return 1. Otherwise, it should return 0.

NOTE: Modules should consider the frequency in which this function is called,
so it generally makes sense to do small batches of work in between calls.

<span id="ValkeyModule_DefragCursorSet"></span>

### `ValkeyModule_DefragCursorSet`

    int ValkeyModule_DefragCursorSet(ValkeyModuleDefragCtx *ctx,
                                     unsigned long cursor);

**Available since:** 6.2.0

Store an arbitrary cursor value for future re-use.

This should only be called if [`ValkeyModule_DefragShouldStop()`](#ValkeyModule_DefragShouldStop) has returned a non-zero
value and the defrag callback is about to exit without fully iterating its
data type.

This behavior is reserved to cases where late defrag is performed. Late
defrag is selected for keys that implement the `free_effort` callback and
return a `free_effort` value that is larger than the defrag
'active-defrag-max-scan-fields' configuration directive.

Smaller keys, keys that do not implement `free_effort` or the global
defrag callback are not called in late-defrag mode. In those cases, a
call to this function will return `VALKEYMODULE_ERR`.

The cursor may be used by the module to represent some progress into the
module's data type. Modules may also store additional cursor-related
information locally and use the cursor as a flag that indicates when
traversal of a new key begins. This is possible because the API makes
a guarantee that concurrent defragmentation of multiple keys will
not be performed.

<span id="ValkeyModule_DefragCursorGet"></span>

### `ValkeyModule_DefragCursorGet`

    int ValkeyModule_DefragCursorGet(ValkeyModuleDefragCtx *ctx,
                                     unsigned long *cursor);

**Available since:** 6.2.0

Fetch a cursor value that has been previously stored using [`ValkeyModule_DefragCursorSet()`](#ValkeyModule_DefragCursorSet).

If not called for a late defrag operation, `VALKEYMODULE_ERR` will be returned and
the cursor should be ignored. See [`ValkeyModule_DefragCursorSet()`](#ValkeyModule_DefragCursorSet) for more details on
defrag cursors.

<span id="ValkeyModule_DefragAlloc"></span>

### `ValkeyModule_DefragAlloc`

    void *ValkeyModule_DefragAlloc(ValkeyModuleDefragCtx *ctx, void *ptr);

**Available since:** 6.2.0

Defrag a memory allocation previously allocated by [`ValkeyModule_Alloc`](#ValkeyModule_Alloc), [`ValkeyModule_Calloc`](#ValkeyModule_Calloc), etc.
The defragmentation process involves allocating a new memory block and copying
the contents to it, like `realloc()`.

If defragmentation was not necessary, NULL is returned and the operation has
no other effect.

If a non-NULL value is returned, the caller should use the new pointer instead
of the old one and update any reference to the old pointer, which must not
be used again.

<span id="ValkeyModule_DefragValkeyModuleString"></span>

### `ValkeyModule_DefragValkeyModuleString`

    ValkeyModuleString *ValkeyModule_DefragValkeyModuleString(ValkeyModuleDefragCtx *ctx,
                                                              ValkeyModuleString *str);

**Available since:** 7.2.5

Defrag a `ValkeyModuleString` previously allocated by [`ValkeyModule_Alloc`](#ValkeyModule_Alloc), [`ValkeyModule_Calloc`](#ValkeyModule_Calloc), etc.
See [`ValkeyModule_DefragAlloc()`](#ValkeyModule_DefragAlloc) for more information on how the defragmentation process
works.

NOTE: It is only possible to defrag strings that have a single reference.
Typically this means strings retained with [`ValkeyModule_RetainString`](#ValkeyModule_RetainString) or [`ValkeyModule_HoldString`](#ValkeyModule_HoldString)
may not be defragmentable. One exception is command argvs which, if retained
by the module, will end up with a single reference (because the reference
on the server side is dropped as soon as the command callback returns).

<span id="ValkeyModule_GetKeyNameFromDefragCtx"></span>

### `ValkeyModule_GetKeyNameFromDefragCtx`

    const ValkeyModuleString *ValkeyModule_GetKeyNameFromDefragCtx(ValkeyModuleDefragCtx *ctx);

**Available since:** 7.0.0

Returns the name of the key currently being processed.
There is no guarantee that the key name is always available, so this may return NULL.

<span id="ValkeyModule_GetDbIdFromDefragCtx"></span>

### `ValkeyModule_GetDbIdFromDefragCtx`

    int ValkeyModule_GetDbIdFromDefragCtx(ValkeyModuleDefragCtx *ctx);

**Available since:** 7.0.0

Returns the database id of the key currently being processed.
There is no guarantee that this info is always available, so this may return -1.

<span id="section-function-index"></span>

## Function index

* [`ValkeyModule_ACLAddLogEntry`](#ValkeyModule_ACLAddLogEntry)
* [`ValkeyModule_ACLAddLogEntryByUserName`](#ValkeyModule_ACLAddLogEntryByUserName)
* [`ValkeyModule_ACLCheckChannelPermissions`](#ValkeyModule_ACLCheckChannelPermissions)
* [`ValkeyModule_ACLCheckCommandPermissions`](#ValkeyModule_ACLCheckCommandPermissions)
* [`ValkeyModule_ACLCheckKeyPermissions`](#ValkeyModule_ACLCheckKeyPermissions)
* [`ValkeyModule_AbortBlock`](#ValkeyModule_AbortBlock)
* [`ValkeyModule_AddACLCategory`](#ValkeyModule_AddACLCategory)
* [`ValkeyModule_AddPostNotificationJob`](#ValkeyModule_AddPostNotificationJob)
* [`ValkeyModule_Alloc`](#ValkeyModule_Alloc)
* [`ValkeyModule_AuthenticateClientWithACLUser`](#ValkeyModule_AuthenticateClientWithACLUser)
* [`ValkeyModule_AuthenticateClientWithUser`](#ValkeyModule_AuthenticateClientWithUser)
* [`ValkeyModule_AutoMemory`](#ValkeyModule_AutoMemory)
* [`ValkeyModule_AvoidReplicaTraffic`](#ValkeyModule_AvoidReplicaTraffic)
* [`ValkeyModule_BlockClient`](#ValkeyModule_BlockClient)
* [`ValkeyModule_BlockClientGetPrivateData`](#ValkeyModule_BlockClientGetPrivateData)
* [`ValkeyModule_BlockClientOnAuth`](#ValkeyModule_BlockClientOnAuth)
* [`ValkeyModule_BlockClientOnKeys`](#ValkeyModule_BlockClientOnKeys)
* [`ValkeyModule_BlockClientOnKeysWithFlags`](#ValkeyModule_BlockClientOnKeysWithFlags)
* [`ValkeyModule_BlockClientSetPrivateData`](#ValkeyModule_BlockClientSetPrivateData)
* [`ValkeyModule_BlockedClientDisconnected`](#ValkeyModule_BlockedClientDisconnected)
* [`ValkeyModule_BlockedClientMeasureTimeEnd`](#ValkeyModule_BlockedClientMeasureTimeEnd)
* [`ValkeyModule_BlockedClientMeasureTimeStart`](#ValkeyModule_BlockedClientMeasureTimeStart)
* [`ValkeyModule_CachedMicroseconds`](#ValkeyModule_CachedMicroseconds)
* [`ValkeyModule_Call`](#ValkeyModule_Call)
* [`ValkeyModule_CallReplyArrayElement`](#ValkeyModule_CallReplyArrayElement)
* [`ValkeyModule_CallReplyAttribute`](#ValkeyModule_CallReplyAttribute)
* [`ValkeyModule_CallReplyAttributeElement`](#ValkeyModule_CallReplyAttributeElement)
* [`ValkeyModule_CallReplyBigNumber`](#ValkeyModule_CallReplyBigNumber)
* [`ValkeyModule_CallReplyBool`](#ValkeyModule_CallReplyBool)
* [`ValkeyModule_CallReplyDouble`](#ValkeyModule_CallReplyDouble)
* [`ValkeyModule_CallReplyInteger`](#ValkeyModule_CallReplyInteger)
* [`ValkeyModule_CallReplyLength`](#ValkeyModule_CallReplyLength)
* [`ValkeyModule_CallReplyMapElement`](#ValkeyModule_CallReplyMapElement)
* [`ValkeyModule_CallReplyPromiseAbort`](#ValkeyModule_CallReplyPromiseAbort)
* [`ValkeyModule_CallReplyPromiseSetUnblockHandler`](#ValkeyModule_CallReplyPromiseSetUnblockHandler)
* [`ValkeyModule_CallReplyProto`](#ValkeyModule_CallReplyProto)
* [`ValkeyModule_CallReplySetElement`](#ValkeyModule_CallReplySetElement)
* [`ValkeyModule_CallReplyStringPtr`](#ValkeyModule_CallReplyStringPtr)
* [`ValkeyModule_CallReplyType`](#ValkeyModule_CallReplyType)
* [`ValkeyModule_CallReplyVerbatim`](#ValkeyModule_CallReplyVerbatim)
* [`ValkeyModule_Calloc`](#ValkeyModule_Calloc)
* [`ValkeyModule_ChannelAtPosWithFlags`](#ValkeyModule_ChannelAtPosWithFlags)
* [`ValkeyModule_CloseKey`](#ValkeyModule_CloseKey)
* [`ValkeyModule_ClusterCanonicalKeyNameInSlot`](#ValkeyModule_ClusterCanonicalKeyNameInSlot)
* [`ValkeyModule_ClusterKeySlot`](#ValkeyModule_ClusterKeySlot)
* [`ValkeyModule_CommandFilterArgDelete`](#ValkeyModule_CommandFilterArgDelete)
* [`ValkeyModule_CommandFilterArgGet`](#ValkeyModule_CommandFilterArgGet)
* [`ValkeyModule_CommandFilterArgInsert`](#ValkeyModule_CommandFilterArgInsert)
* [`ValkeyModule_CommandFilterArgReplace`](#ValkeyModule_CommandFilterArgReplace)
* [`ValkeyModule_CommandFilterArgsCount`](#ValkeyModule_CommandFilterArgsCount)
* [`ValkeyModule_CommandFilterGetClientId`](#ValkeyModule_CommandFilterGetClientId)
* [`ValkeyModule_CreateCommand`](#ValkeyModule_CreateCommand)
* [`ValkeyModule_CreateDataType`](#ValkeyModule_CreateDataType)
* [`ValkeyModule_CreateDict`](#ValkeyModule_CreateDict)
* [`ValkeyModule_CreateModuleUser`](#ValkeyModule_CreateModuleUser)
* [`ValkeyModule_CreateString`](#ValkeyModule_CreateString)
* [`ValkeyModule_CreateStringFromCallReply`](#ValkeyModule_CreateStringFromCallReply)
* [`ValkeyModule_CreateStringFromDouble`](#ValkeyModule_CreateStringFromDouble)
* [`ValkeyModule_CreateStringFromLongDouble`](#ValkeyModule_CreateStringFromLongDouble)
* [`ValkeyModule_CreateStringFromLongLong`](#ValkeyModule_CreateStringFromLongLong)
* [`ValkeyModule_CreateStringFromStreamID`](#ValkeyModule_CreateStringFromStreamID)
* [`ValkeyModule_CreateStringFromString`](#ValkeyModule_CreateStringFromString)
* [`ValkeyModule_CreateStringFromULongLong`](#ValkeyModule_CreateStringFromULongLong)
* [`ValkeyModule_CreateStringPrintf`](#ValkeyModule_CreateStringPrintf)
* [`ValkeyModule_CreateSubcommand`](#ValkeyModule_CreateSubcommand)
* [`ValkeyModule_CreateTimer`](#ValkeyModule_CreateTimer)
* [`ValkeyModule_DbSize`](#ValkeyModule_DbSize)
* [`ValkeyModule_DeauthenticateAndCloseClient`](#ValkeyModule_DeauthenticateAndCloseClient)
* [`ValkeyModule_DefragAlloc`](#ValkeyModule_DefragAlloc)
* [`ValkeyModule_DefragCursorGet`](#ValkeyModule_DefragCursorGet)
* [`ValkeyModule_DefragCursorSet`](#ValkeyModule_DefragCursorSet)
* [`ValkeyModule_DefragShouldStop`](#ValkeyModule_DefragShouldStop)
* [`ValkeyModule_DefragValkeyModuleString`](#ValkeyModule_DefragValkeyModuleString)
* [`ValkeyModule_DeleteKey`](#ValkeyModule_DeleteKey)
* [`ValkeyModule_DictCompare`](#ValkeyModule_DictCompare)
* [`ValkeyModule_DictCompareC`](#ValkeyModule_DictCompareC)
* [`ValkeyModule_DictDel`](#ValkeyModule_DictDel)
* [`ValkeyModule_DictDelC`](#ValkeyModule_DictDelC)
* [`ValkeyModule_DictGet`](#ValkeyModule_DictGet)
* [`ValkeyModule_DictGetC`](#ValkeyModule_DictGetC)
* [`ValkeyModule_DictIteratorReseek`](#ValkeyModule_DictIteratorReseek)
* [`ValkeyModule_DictIteratorReseekC`](#ValkeyModule_DictIteratorReseekC)
* [`ValkeyModule_DictIteratorStart`](#ValkeyModule_DictIteratorStart)
* [`ValkeyModule_DictIteratorStartC`](#ValkeyModule_DictIteratorStartC)
* [`ValkeyModule_DictIteratorStop`](#ValkeyModule_DictIteratorStop)
* [`ValkeyModule_DictNext`](#ValkeyModule_DictNext)
* [`ValkeyModule_DictNextC`](#ValkeyModule_DictNextC)
* [`ValkeyModule_DictPrev`](#ValkeyModule_DictPrev)
* [`ValkeyModule_DictPrevC`](#ValkeyModule_DictPrevC)
* [`ValkeyModule_DictReplace`](#ValkeyModule_DictReplace)
* [`ValkeyModule_DictReplaceC`](#ValkeyModule_DictReplaceC)
* [`ValkeyModule_DictSet`](#ValkeyModule_DictSet)
* [`ValkeyModule_DictSetC`](#ValkeyModule_DictSetC)
* [`ValkeyModule_DictSize`](#ValkeyModule_DictSize)
* [`ValkeyModule_DigestAddLongLong`](#ValkeyModule_DigestAddLongLong)
* [`ValkeyModule_DigestAddStringBuffer`](#ValkeyModule_DigestAddStringBuffer)
* [`ValkeyModule_DigestEndSequence`](#ValkeyModule_DigestEndSequence)
* [`ValkeyModule_EmitAOF`](#ValkeyModule_EmitAOF)
* [`ValkeyModule_EventLoopAdd`](#ValkeyModule_EventLoopAdd)
* [`ValkeyModule_EventLoopAddOneShot`](#ValkeyModule_EventLoopAddOneShot)
* [`ValkeyModule_EventLoopDel`](#ValkeyModule_EventLoopDel)
* [`ValkeyModule_ExitFromChild`](#ValkeyModule_ExitFromChild)
* [`ValkeyModule_ExportSharedAPI`](#ValkeyModule_ExportSharedAPI)
* [`ValkeyModule_Fork`](#ValkeyModule_Fork)
* [`ValkeyModule_Free`](#ValkeyModule_Free)
* [`ValkeyModule_FreeCallReply`](#ValkeyModule_FreeCallReply)
* [`ValkeyModule_FreeClusterNodesList`](#ValkeyModule_FreeClusterNodesList)
* [`ValkeyModule_FreeDict`](#ValkeyModule_FreeDict)
* [`ValkeyModule_FreeModuleUser`](#ValkeyModule_FreeModuleUser)
* [`ValkeyModule_FreeServerInfo`](#ValkeyModule_FreeServerInfo)
* [`ValkeyModule_FreeString`](#ValkeyModule_FreeString)
* [`ValkeyModule_FreeThreadSafeContext`](#ValkeyModule_FreeThreadSafeContext)
* [`ValkeyModule_GetAbsExpire`](#ValkeyModule_GetAbsExpire)
* [`ValkeyModule_GetBlockedClientHandle`](#ValkeyModule_GetBlockedClientHandle)
* [`ValkeyModule_GetBlockedClientPrivateData`](#ValkeyModule_GetBlockedClientPrivateData)
* [`ValkeyModule_GetBlockedClientReadyKey`](#ValkeyModule_GetBlockedClientReadyKey)
* [`ValkeyModule_GetClientCertificate`](#ValkeyModule_GetClientCertificate)
* [`ValkeyModule_GetClientId`](#ValkeyModule_GetClientId)
* [`ValkeyModule_GetClientInfoById`](#ValkeyModule_GetClientInfoById)
* [`ValkeyModule_GetClientNameById`](#ValkeyModule_GetClientNameById)
* [`ValkeyModule_GetClientUserNameById`](#ValkeyModule_GetClientUserNameById)
* [`ValkeyModule_GetClusterNodeInfo`](#ValkeyModule_GetClusterNodeInfo)
* [`ValkeyModule_GetClusterNodeInfoForClient`](#ValkeyModule_GetClusterNodeInfoForClient)
* [`ValkeyModule_GetClusterNodesList`](#ValkeyModule_GetClusterNodesList)
* [`ValkeyModule_GetClusterSize`](#ValkeyModule_GetClusterSize)
* [`ValkeyModule_GetCommand`](#ValkeyModule_GetCommand)
* [`ValkeyModule_GetCommandKeys`](#ValkeyModule_GetCommandKeys)
* [`ValkeyModule_GetCommandKeysWithFlags`](#ValkeyModule_GetCommandKeysWithFlags)
* [`ValkeyModule_GetContextFlags`](#ValkeyModule_GetContextFlags)
* [`ValkeyModule_GetContextFlagsAll`](#ValkeyModule_GetContextFlagsAll)
* [`ValkeyModule_GetCurrentCommandName`](#ValkeyModule_GetCurrentCommandName)
* [`ValkeyModule_GetCurrentUserName`](#ValkeyModule_GetCurrentUserName)
* [`ValkeyModule_GetDbIdFromDefragCtx`](#ValkeyModule_GetDbIdFromDefragCtx)
* [`ValkeyModule_GetDbIdFromDigest`](#ValkeyModule_GetDbIdFromDigest)
* [`ValkeyModule_GetDbIdFromIO`](#ValkeyModule_GetDbIdFromIO)
* [`ValkeyModule_GetDbIdFromModuleKey`](#ValkeyModule_GetDbIdFromModuleKey)
* [`ValkeyModule_GetDbIdFromOptCtx`](#ValkeyModule_GetDbIdFromOptCtx)
* [`ValkeyModule_GetDetachedThreadSafeContext`](#ValkeyModule_GetDetachedThreadSafeContext)
* [`ValkeyModule_GetExpire`](#ValkeyModule_GetExpire)
* [`ValkeyModule_GetFunctionExecutionState`](#ValkeyModule_GetFunctionExecutionState)
* [`ValkeyModule_GetKeyNameFromDefragCtx`](#ValkeyModule_GetKeyNameFromDefragCtx)
* [`ValkeyModule_GetKeyNameFromDigest`](#ValkeyModule_GetKeyNameFromDigest)
* [`ValkeyModule_GetKeyNameFromIO`](#ValkeyModule_GetKeyNameFromIO)
* [`ValkeyModule_GetKeyNameFromModuleKey`](#ValkeyModule_GetKeyNameFromModuleKey)
* [`ValkeyModule_GetKeyNameFromOptCtx`](#ValkeyModule_GetKeyNameFromOptCtx)
* [`ValkeyModule_GetKeyspaceNotificationFlagsAll`](#ValkeyModule_GetKeyspaceNotificationFlagsAll)
* [`ValkeyModule_GetLFU`](#ValkeyModule_GetLFU)
* [`ValkeyModule_GetLRU`](#ValkeyModule_GetLRU)
* [`ValkeyModule_GetModuleOptionsAll`](#ValkeyModule_GetModuleOptionsAll)
* [`ValkeyModule_GetModuleUserACLString`](#ValkeyModule_GetModuleUserACLString)
* [`ValkeyModule_GetModuleUserFromUserName`](#ValkeyModule_GetModuleUserFromUserName)
* [`ValkeyModule_GetMyClusterID`](#ValkeyModule_GetMyClusterID)
* [`ValkeyModule_GetNotifyKeyspaceEvents`](#ValkeyModule_GetNotifyKeyspaceEvents)
* [`ValkeyModule_GetOpenKeyModesAll`](#ValkeyModule_GetOpenKeyModesAll)
* [`ValkeyModule_GetRandomBytes`](#ValkeyModule_GetRandomBytes)
* [`ValkeyModule_GetRandomHexChars`](#ValkeyModule_GetRandomHexChars)
* [`ValkeyModule_GetSelectedDb`](#ValkeyModule_GetSelectedDb)
* [`ValkeyModule_GetServerInfo`](#ValkeyModule_GetServerInfo)
* [`ValkeyModule_GetServerVersion`](#ValkeyModule_GetServerVersion)
* [`ValkeyModule_GetSharedAPI`](#ValkeyModule_GetSharedAPI)
* [`ValkeyModule_GetThreadSafeContext`](#ValkeyModule_GetThreadSafeContext)
* [`ValkeyModule_GetTimerInfo`](#ValkeyModule_GetTimerInfo)
* [`ValkeyModule_GetToDbIdFromOptCtx`](#ValkeyModule_GetToDbIdFromOptCtx)
* [`ValkeyModule_GetToKeyNameFromOptCtx`](#ValkeyModule_GetToKeyNameFromOptCtx)
* [`ValkeyModule_GetTypeMethodVersion`](#ValkeyModule_GetTypeMethodVersion)
* [`ValkeyModule_GetUsedMemoryRatio`](#ValkeyModule_GetUsedMemoryRatio)
* [`ValkeyModule_HashGet`](#ValkeyModule_HashGet)
* [`ValkeyModule_HashSet`](#ValkeyModule_HashSet)
* [`ValkeyModule_HoldString`](#ValkeyModule_HoldString)
* [`ValkeyModule_InfoAddFieldCString`](#ValkeyModule_InfoAddFieldCString)
* [`ValkeyModule_InfoAddFieldDouble`](#ValkeyModule_InfoAddFieldDouble)
* [`ValkeyModule_InfoAddFieldLongLong`](#ValkeyModule_InfoAddFieldLongLong)
* [`ValkeyModule_InfoAddFieldString`](#ValkeyModule_InfoAddFieldString)
* [`ValkeyModule_InfoAddFieldULongLong`](#ValkeyModule_InfoAddFieldULongLong)
* [`ValkeyModule_InfoAddSection`](#ValkeyModule_InfoAddSection)
* [`ValkeyModule_InfoBeginDictField`](#ValkeyModule_InfoBeginDictField)
* [`ValkeyModule_InfoEndDictField`](#ValkeyModule_InfoEndDictField)
* [`ValkeyModule_IsBlockedReplyRequest`](#ValkeyModule_IsBlockedReplyRequest)
* [`ValkeyModule_IsBlockedTimeoutRequest`](#ValkeyModule_IsBlockedTimeoutRequest)
* [`ValkeyModule_IsChannelsPositionRequest`](#ValkeyModule_IsChannelsPositionRequest)
* [`ValkeyModule_IsIOError`](#ValkeyModule_IsIOError)
* [`ValkeyModule_IsKeysPositionRequest`](#ValkeyModule_IsKeysPositionRequest)
* [`ValkeyModule_IsModuleNameBusy`](#ValkeyModule_IsModuleNameBusy)
* [`ValkeyModule_IsSubEventSupported`](#ValkeyModule_IsSubEventSupported)
* [`ValkeyModule_KeyAtPos`](#ValkeyModule_KeyAtPos)
* [`ValkeyModule_KeyAtPosWithFlags`](#ValkeyModule_KeyAtPosWithFlags)
* [`ValkeyModule_KeyExists`](#ValkeyModule_KeyExists)
* [`ValkeyModule_KeyType`](#ValkeyModule_KeyType)
* [`ValkeyModule_KillForkChild`](#ValkeyModule_KillForkChild)
* [`ValkeyModule_LatencyAddSample`](#ValkeyModule_LatencyAddSample)
* [`ValkeyModule_ListDelete`](#ValkeyModule_ListDelete)
* [`ValkeyModule_ListGet`](#ValkeyModule_ListGet)
* [`ValkeyModule_ListInsert`](#ValkeyModule_ListInsert)
* [`ValkeyModule_ListPop`](#ValkeyModule_ListPop)
* [`ValkeyModule_ListPush`](#ValkeyModule_ListPush)
* [`ValkeyModule_ListSet`](#ValkeyModule_ListSet)
* [`ValkeyModule_LoadConfigs`](#ValkeyModule_LoadConfigs)
* [`ValkeyModule_LoadDataTypeFromString`](#ValkeyModule_LoadDataTypeFromString)
* [`ValkeyModule_LoadDataTypeFromStringEncver`](#ValkeyModule_LoadDataTypeFromStringEncver)
* [`ValkeyModule_LoadDouble`](#ValkeyModule_LoadDouble)
* [`ValkeyModule_LoadFloat`](#ValkeyModule_LoadFloat)
* [`ValkeyModule_LoadLongDouble`](#ValkeyModule_LoadLongDouble)
* [`ValkeyModule_LoadSigned`](#ValkeyModule_LoadSigned)
* [`ValkeyModule_LoadString`](#ValkeyModule_LoadString)
* [`ValkeyModule_LoadStringBuffer`](#ValkeyModule_LoadStringBuffer)
* [`ValkeyModule_LoadUnsigned`](#ValkeyModule_LoadUnsigned)
* [`ValkeyModule_Log`](#ValkeyModule_Log)
* [`ValkeyModule_LogIOError`](#ValkeyModule_LogIOError)
* [`ValkeyModule_MallocSize`](#ValkeyModule_MallocSize)
* [`ValkeyModule_MallocSizeDict`](#ValkeyModule_MallocSizeDict)
* [`ValkeyModule_MallocSizeString`](#ValkeyModule_MallocSizeString)
* [`ValkeyModule_MallocUsableSize`](#ValkeyModule_MallocUsableSize)
* [`ValkeyModule_Microseconds`](#ValkeyModule_Microseconds)
* [`ValkeyModule_Milliseconds`](#ValkeyModule_Milliseconds)
* [`ValkeyModule_ModuleTypeGetType`](#ValkeyModule_ModuleTypeGetType)
* [`ValkeyModule_ModuleTypeGetValue`](#ValkeyModule_ModuleTypeGetValue)
* [`ValkeyModule_ModuleTypeReplaceValue`](#ValkeyModule_ModuleTypeReplaceValue)
* [`ValkeyModule_ModuleTypeSetValue`](#ValkeyModule_ModuleTypeSetValue)
* [`ValkeyModule_MonotonicMicroseconds`](#ValkeyModule_MonotonicMicroseconds)
* [`ValkeyModule_MustObeyClient`](#ValkeyModule_MustObeyClient)
* [`ValkeyModule_NotifyKeyspaceEvent`](#ValkeyModule_NotifyKeyspaceEvent)
* [`ValkeyModule_OpenKey`](#ValkeyModule_OpenKey)
* [`ValkeyModule_PoolAlloc`](#ValkeyModule_PoolAlloc)
* [`ValkeyModule_PublishMessage`](#ValkeyModule_PublishMessage)
* [`ValkeyModule_PublishMessageShard`](#ValkeyModule_PublishMessageShard)
* [`ValkeyModule_RandomKey`](#ValkeyModule_RandomKey)
* [`ValkeyModule_RdbLoad`](#ValkeyModule_RdbLoad)
* [`ValkeyModule_RdbSave`](#ValkeyModule_RdbSave)
* [`ValkeyModule_RdbStreamCreateFromFile`](#ValkeyModule_RdbStreamCreateFromFile)
* [`ValkeyModule_RdbStreamFree`](#ValkeyModule_RdbStreamFree)
* [`ValkeyModule_Realloc`](#ValkeyModule_Realloc)
* [`ValkeyModule_RedactClientCommandArgument`](#ValkeyModule_RedactClientCommandArgument)
* [`ValkeyModule_RegisterAuthCallback`](#ValkeyModule_RegisterAuthCallback)
* [`ValkeyModule_RegisterBoolConfig`](#ValkeyModule_RegisterBoolConfig)
* [`ValkeyModule_RegisterClusterMessageReceiver`](#ValkeyModule_RegisterClusterMessageReceiver)
* [`ValkeyModule_RegisterCommandFilter`](#ValkeyModule_RegisterCommandFilter)
* [`ValkeyModule_RegisterDefragFunc`](#ValkeyModule_RegisterDefragFunc)
* [`ValkeyModule_RegisterEnumConfig`](#ValkeyModule_RegisterEnumConfig)
* [`ValkeyModule_RegisterInfoFunc`](#ValkeyModule_RegisterInfoFunc)
* [`ValkeyModule_RegisterNumericConfig`](#ValkeyModule_RegisterNumericConfig)
* [`ValkeyModule_RegisterScriptingEngine`](#ValkeyModule_RegisterScriptingEngine)
* [`ValkeyModule_RegisterStringConfig`](#ValkeyModule_RegisterStringConfig)
* [`ValkeyModule_Replicate`](#ValkeyModule_Replicate)
* [`ValkeyModule_ReplicateVerbatim`](#ValkeyModule_ReplicateVerbatim)
* [`ValkeyModule_ReplySetArrayLength`](#ValkeyModule_ReplySetArrayLength)
* [`ValkeyModule_ReplySetAttributeLength`](#ValkeyModule_ReplySetAttributeLength)
* [`ValkeyModule_ReplySetMapLength`](#ValkeyModule_ReplySetMapLength)
* [`ValkeyModule_ReplySetSetLength`](#ValkeyModule_ReplySetSetLength)
* [`ValkeyModule_ReplyWithArray`](#ValkeyModule_ReplyWithArray)
* [`ValkeyModule_ReplyWithAttribute`](#ValkeyModule_ReplyWithAttribute)
* [`ValkeyModule_ReplyWithBigNumber`](#ValkeyModule_ReplyWithBigNumber)
* [`ValkeyModule_ReplyWithBool`](#ValkeyModule_ReplyWithBool)
* [`ValkeyModule_ReplyWithCString`](#ValkeyModule_ReplyWithCString)
* [`ValkeyModule_ReplyWithCallReply`](#ValkeyModule_ReplyWithCallReply)
* [`ValkeyModule_ReplyWithDouble`](#ValkeyModule_ReplyWithDouble)
* [`ValkeyModule_ReplyWithEmptyArray`](#ValkeyModule_ReplyWithEmptyArray)
* [`ValkeyModule_ReplyWithEmptyString`](#ValkeyModule_ReplyWithEmptyString)
* [`ValkeyModule_ReplyWithError`](#ValkeyModule_ReplyWithError)
* [`ValkeyModule_ReplyWithErrorFormat`](#ValkeyModule_ReplyWithErrorFormat)
* [`ValkeyModule_ReplyWithLongDouble`](#ValkeyModule_ReplyWithLongDouble)
* [`ValkeyModule_ReplyWithLongLong`](#ValkeyModule_ReplyWithLongLong)
* [`ValkeyModule_ReplyWithMap`](#ValkeyModule_ReplyWithMap)
* [`ValkeyModule_ReplyWithNull`](#ValkeyModule_ReplyWithNull)
* [`ValkeyModule_ReplyWithNullArray`](#ValkeyModule_ReplyWithNullArray)
* [`ValkeyModule_ReplyWithSet`](#ValkeyModule_ReplyWithSet)
* [`ValkeyModule_ReplyWithSimpleString`](#ValkeyModule_ReplyWithSimpleString)
* [`ValkeyModule_ReplyWithString`](#ValkeyModule_ReplyWithString)
* [`ValkeyModule_ReplyWithStringBuffer`](#ValkeyModule_ReplyWithStringBuffer)
* [`ValkeyModule_ReplyWithVerbatimString`](#ValkeyModule_ReplyWithVerbatimString)
* [`ValkeyModule_ReplyWithVerbatimStringType`](#ValkeyModule_ReplyWithVerbatimStringType)
* [`ValkeyModule_ResetDataset`](#ValkeyModule_ResetDataset)
* [`ValkeyModule_RetainString`](#ValkeyModule_RetainString)
* [`ValkeyModule_SaveDataTypeToString`](#ValkeyModule_SaveDataTypeToString)
* [`ValkeyModule_SaveDouble`](#ValkeyModule_SaveDouble)
* [`ValkeyModule_SaveFloat`](#ValkeyModule_SaveFloat)
* [`ValkeyModule_SaveLongDouble`](#ValkeyModule_SaveLongDouble)
* [`ValkeyModule_SaveSigned`](#ValkeyModule_SaveSigned)
* [`ValkeyModule_SaveString`](#ValkeyModule_SaveString)
* [`ValkeyModule_SaveStringBuffer`](#ValkeyModule_SaveStringBuffer)
* [`ValkeyModule_SaveUnsigned`](#ValkeyModule_SaveUnsigned)
* [`ValkeyModule_Scan`](#ValkeyModule_Scan)
* [`ValkeyModule_ScanCursorCreate`](#ValkeyModule_ScanCursorCreate)
* [`ValkeyModule_ScanCursorDestroy`](#ValkeyModule_ScanCursorDestroy)
* [`ValkeyModule_ScanCursorRestart`](#ValkeyModule_ScanCursorRestart)
* [`ValkeyModule_ScanKey`](#ValkeyModule_ScanKey)
* [`ValkeyModule_SelectDb`](#ValkeyModule_SelectDb)
* [`ValkeyModule_SendChildHeartbeat`](#ValkeyModule_SendChildHeartbeat)
* [`ValkeyModule_SendClusterMessage`](#ValkeyModule_SendClusterMessage)
* [`ValkeyModule_ServerInfoGetField`](#ValkeyModule_ServerInfoGetField)
* [`ValkeyModule_ServerInfoGetFieldC`](#ValkeyModule_ServerInfoGetFieldC)
* [`ValkeyModule_ServerInfoGetFieldDouble`](#ValkeyModule_ServerInfoGetFieldDouble)
* [`ValkeyModule_ServerInfoGetFieldSigned`](#ValkeyModule_ServerInfoGetFieldSigned)
* [`ValkeyModule_ServerInfoGetFieldUnsigned`](#ValkeyModule_ServerInfoGetFieldUnsigned)
* [`ValkeyModule_SetAbsExpire`](#ValkeyModule_SetAbsExpire)
* [`ValkeyModule_SetClientNameById`](#ValkeyModule_SetClientNameById)
* [`ValkeyModule_SetClusterFlags`](#ValkeyModule_SetClusterFlags)
* [`ValkeyModule_SetCommandACLCategories`](#ValkeyModule_SetCommandACLCategories)
* [`ValkeyModule_SetCommandInfo`](#ValkeyModule_SetCommandInfo)
* [`ValkeyModule_SetContextUser`](#ValkeyModule_SetContextUser)
* [`ValkeyModule_SetDisconnectCallback`](#ValkeyModule_SetDisconnectCallback)
* [`ValkeyModule_SetExpire`](#ValkeyModule_SetExpire)
* [`ValkeyModule_SetLFU`](#ValkeyModule_SetLFU)
* [`ValkeyModule_SetLRU`](#ValkeyModule_SetLRU)
* [`ValkeyModule_SetModuleOptions`](#ValkeyModule_SetModuleOptions)
* [`ValkeyModule_SetModuleUserACL`](#ValkeyModule_SetModuleUserACL)
* [`ValkeyModule_SetModuleUserACLString`](#ValkeyModule_SetModuleUserACLString)
* [`ValkeyModule_SignalKeyAsReady`](#ValkeyModule_SignalKeyAsReady)
* [`ValkeyModule_SignalModifiedKey`](#ValkeyModule_SignalModifiedKey)
* [`ValkeyModule_StopTimer`](#ValkeyModule_StopTimer)
* [`ValkeyModule_Strdup`](#ValkeyModule_Strdup)
* [`ValkeyModule_StreamAdd`](#ValkeyModule_StreamAdd)
* [`ValkeyModule_StreamDelete`](#ValkeyModule_StreamDelete)
* [`ValkeyModule_StreamIteratorDelete`](#ValkeyModule_StreamIteratorDelete)
* [`ValkeyModule_StreamIteratorNextField`](#ValkeyModule_StreamIteratorNextField)
* [`ValkeyModule_StreamIteratorNextID`](#ValkeyModule_StreamIteratorNextID)
* [`ValkeyModule_StreamIteratorStart`](#ValkeyModule_StreamIteratorStart)
* [`ValkeyModule_StreamIteratorStop`](#ValkeyModule_StreamIteratorStop)
* [`ValkeyModule_StreamTrimByID`](#ValkeyModule_StreamTrimByID)
* [`ValkeyModule_StreamTrimByLength`](#ValkeyModule_StreamTrimByLength)
* [`ValkeyModule_StringAppendBuffer`](#ValkeyModule_StringAppendBuffer)
* [`ValkeyModule_StringCompare`](#ValkeyModule_StringCompare)
* [`ValkeyModule_StringDMA`](#ValkeyModule_StringDMA)
* [`ValkeyModule_StringPtrLen`](#ValkeyModule_StringPtrLen)
* [`ValkeyModule_StringSet`](#ValkeyModule_StringSet)
* [`ValkeyModule_StringToDouble`](#ValkeyModule_StringToDouble)
* [`ValkeyModule_StringToLongDouble`](#ValkeyModule_StringToLongDouble)
* [`ValkeyModule_StringToLongLong`](#ValkeyModule_StringToLongLong)
* [`ValkeyModule_StringToStreamID`](#ValkeyModule_StringToStreamID)
* [`ValkeyModule_StringToULongLong`](#ValkeyModule_StringToULongLong)
* [`ValkeyModule_StringTruncate`](#ValkeyModule_StringTruncate)
* [`ValkeyModule_SubscribeToKeyspaceEvents`](#ValkeyModule_SubscribeToKeyspaceEvents)
* [`ValkeyModule_SubscribeToServerEvent`](#ValkeyModule_SubscribeToServerEvent)
* [`ValkeyModule_ThreadSafeContextLock`](#ValkeyModule_ThreadSafeContextLock)
* [`ValkeyModule_ThreadSafeContextTryLock`](#ValkeyModule_ThreadSafeContextTryLock)
* [`ValkeyModule_ThreadSafeContextUnlock`](#ValkeyModule_ThreadSafeContextUnlock)
* [`ValkeyModule_TrimStringAllocation`](#ValkeyModule_TrimStringAllocation)
* [`ValkeyModule_TryAlloc`](#ValkeyModule_TryAlloc)
* [`ValkeyModule_TryCalloc`](#ValkeyModule_TryCalloc)
* [`ValkeyModule_TryRealloc`](#ValkeyModule_TryRealloc)
* [`ValkeyModule_UnblockClient`](#ValkeyModule_UnblockClient)
* [`ValkeyModule_UnlinkKey`](#ValkeyModule_UnlinkKey)
* [`ValkeyModule_UnregisterCommandFilter`](#ValkeyModule_UnregisterCommandFilter)
* [`ValkeyModule_UnregisterScriptingEngine`](#ValkeyModule_UnregisterScriptingEngine)
* [`ValkeyModule_UpdateRuntimeArgs`](#ValkeyModule_UpdateRuntimeArgs)
* [`ValkeyModule_ValueLength`](#ValkeyModule_ValueLength)
* [`ValkeyModule_WrongArity`](#ValkeyModule_WrongArity)
* [`ValkeyModule_Yield`](#ValkeyModule_Yield)
* [`ValkeyModule_ZsetAdd`](#ValkeyModule_ZsetAdd)
* [`ValkeyModule_ZsetFirstInLexRange`](#ValkeyModule_ZsetFirstInLexRange)
* [`ValkeyModule_ZsetFirstInScoreRange`](#ValkeyModule_ZsetFirstInScoreRange)
* [`ValkeyModule_ZsetIncrby`](#ValkeyModule_ZsetIncrby)
* [`ValkeyModule_ZsetLastInLexRange`](#ValkeyModule_ZsetLastInLexRange)
* [`ValkeyModule_ZsetLastInScoreRange`](#ValkeyModule_ZsetLastInScoreRange)
* [`ValkeyModule_ZsetRangeCurrentElement`](#ValkeyModule_ZsetRangeCurrentElement)
* [`ValkeyModule_ZsetRangeEndReached`](#ValkeyModule_ZsetRangeEndReached)
* [`ValkeyModule_ZsetRangeNext`](#ValkeyModule_ZsetRangeNext)
* [`ValkeyModule_ZsetRangePrev`](#ValkeyModule_ZsetRangePrev)
* [`ValkeyModule_ZsetRangeStop`](#ValkeyModule_ZsetRangeStop)
* [`ValkeyModule_ZsetRem`](#ValkeyModule_ZsetRem)
* [`ValkeyModule_ZsetScore`](#ValkeyModule_ZsetScore)
* [`ValkeyModule__Assert`](#ValkeyModule__Assert)

