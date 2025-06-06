+++
title=  "Valkey Modules Rust SDK updates"
date= 2025-05-20 01:01:01
description= "Extending Valkey using Rust SDK."
authors= ["dmitrypol"]
categories= "modules"

[extra]
categories= "performance"
featured = false
featured_image = "/assets/media/featured/random-04.webp"
+++

In an earlier [article](/blog/modules-101/) we explored the process of building Valkey Modules to enable developers to add features such as new commands and data types to Valkey without modifying its core.
We also introduced the [Valkey Modules Rust SDK](https://github.com/valkey-io/valkeymodule-rs) demonstrating how to use it to create a basic module.
In this follow-up article, we’ll dive deeper into the SDK and highlight several new features and improvements introduced over the past year.
This article assumes that the reader is well familiar with Rust and Valkey modules.

## What is the Valkey Modules Rust SDK?  

The SDK is based on [Redis Modules Rust SDK](https://github.com/RedisLabsModules/redismodule-rs) and provides abstraction APIs on top of Valkey's own modules API.
For those familiar with Rust development the SDK is a Rust crate that can be added to `Cargo.toml` file like any other Rust dependency.
It requires the underlying Valkey server to have appropriate module APIs but allows writing Valkey modules in Rust, without needing to use raw pointers or unsafe code.
The recently released [Bloom Filters module](/blog/introducing-bloom-filters/) is built using this SDK and several of the developers who worked on the module contributed to the SDK.
Let's deep dive into the new features.

## Client

We begin with enhancements that give developers deeper insight into the clients connected to Valkey.
The `Context` struct has been extended with several new functions that allow retrieving client specific data, such as client name, username or IP address.
It provides Rust wrappers around `Module_GetClient*` functions in the underlying Valkey Module API.
Most of these new functions return `ValkeyResult` so that the module developer can handle the error appropriately.
The functions can be called for the current client or by specifying `client_id`.

```rust
fn my_client_cmd(ctx: &Context, _args: Vec<ValkeyString>) -> ValkeyResult {
    let client_id = ctx.get_client_id();
    let username = ctx.get_client_username_by_id(client_id);
    Ok(ValkeyValue::from(username.to_string()))
}
valkey_module! {
    ...
    commands: [
        ["my_client_cmd", my_client_cmd, "", 0, 0, 0],
    ]
}
```

## Auth callback

Another key improvement is support for authentication callbacks introduced in Valkey 7.2.
Thanks to the new features in the SDK Rust modules can now integrate directly with Valkey's auth flow, making it possible to implement custom authentication logic or enhance security policies on a per-client basis.
One potential use case is to combine it with `ctx.get_client_ip` function described above to allow some users access only from specific IP addresses.

```rust
fn auth_callback(
    ctx: &Context,
    username: ValkeyString,
    _password: ValkeyString,
) -> Result<c_int, ValkeyError> {
    if ctx.authenticate_client_with_acl_user(&username) == Status::Ok {
        let _client_ip = ctx.get_client_ip()?;
        ...
        return Ok(AUTH_HANDLED);
    }
    Ok(AUTH_NOT_HANDLED)
}
valkey_module! {
    ...
    auth: [auth_callback],
}
```

## Preload validation

While the `valkey_module!` macro already provided an `init` callback to execute custom code during module load, it executed at the very end of the module load after new commands and data types were created.
That can be useful but what if we wanted to stop module load before any of that happened?
For example, we might need to restrict a module to be loaded only on specific version of Valkey.
That's where the optional `preload` comes in.

```rust
fn preload_fn(ctx: &Context, _args: &[ValkeyString]) -> Status {
    let _version = ctx.get_server_version().unwrap();
    // respond with Status::Ok or Status::Err to prevent loading
    Status::Ok
}
valkey_module! {
    ...
    preload: preload_fn,
    commands: [],
}
```

## Filters

To execute custom code before specific Valkey commands we can use command filters which is now supported in the SDK.
Filters can be leveraged to replace default commands with custom commands or modify arguments.
Thanks to the abstractions provided by the SDK we simply need to create a Rust function and register it in the `valkey_module!` macro.
Note of caution - since filters are executed before every command this code needs to be optimized for performance.

```rust
fn my_filter_fn(_ctx: *mut RedisModuleCommandFilterCtx) {
    let cf_ctx = CommandFilterCtx::new(ctx);
    // check the number of arguments
    if cf_ctx.args_count() != 3 {
        return;
    }
    // get which command is being executed
    let _cmd = cf_ctx.cmd_get_try_as_str().unwrap();
    // grab various args passed to the command
    let _all_args = cf_ctx.get_all_args_wo_cmd();
    // replace command
    cf_ctx.arg_replace(0, "custom_cmd");
}
valkey_module! {
    ...
    filters: [
        [my_filter_fn, VALKEYMODULE_CMDFILTER_NOSELF],
    ]
}
```

## New event handlers

Reacting to server events can be very important to the module behavior.
The SDK has expanded its support for registering event handlers, allowing developers to hook into more server-side events.
We can use this to execute our own code on client connect/disconnect, server shutdown or specific key events.

```rust
#[client_changed_event_handler]
fn client_changed_event_handler(_ctx: &Context, client_event: ClientChangeSubevent) {
    match client_event {
        ClientChangeSubevent::Connected => {}
        ClientChangeSubevent::Disconnected => {}
    }
}
#[shutdown_event_handler]
fn shutdown_event_handler(_ctx: &Context, _event: u64) {
    ...
}
#[key_event_handler]
fn key_event_handler(ctx: &Context, key_event: KeyChangeSubevent) {
    match key_event {
        KeyChangeSubevent::Deleted => {}
        KeyChangeSubevent::Evicted => {}
        KeyChangeSubevent::Overwritten => {}
        KeyChangeSubevent::Expired => {}
    }
}
```

## Custom ACL categories support

Valkey 8 introduced support for custom ACL categories which simplifies access control for custom commands introduced in a module.
To implement that we need to enable `required-features = ["min-valkey-compatibility-version-8-0"]` in `Cargo.toml` and register new categories in `valkey_module!` macro.
Then we can restrict our custom commands to these custom ACL categories.

```rust
valkey_module! {
    ...
    acl_categories: [
        "acl_one",
        "acl_two"
    ]
    commands: [
        ["cmd1", cmd1, "write",  0, 0, 0, "acl_one"],
        ["cmd2", cmd2, "", 0, 0, 0, "acl_one acl_two"],
    ]
```

## Validating / Rejecting CONFIG SET

Configuration flexibility is important but so is validation.
The SDK now supports specifying optional callback functions to validate or reject custom configurations.
This is available for `String`, `i64`, `bool` and `enum` configs.  
Here is an example of such validation for `i64` custom config.  

```rust
lazy_static! {
    static ref CONFIG_I64: ValkeyGILGuard<i64> = ValkeyGILGuard::default();
}
fn on_i64_config_set<G, T: ConfigurationValue<i64>>(
    config_ctx: &ConfigurationContext,
    _name: &str,
    val: &'static T,
) -> Result<(), ValkeyError> {
    if val.get(config_ctx) == custom_logic_here {
        log_notice("log message here");
        Err(ValkeyError::Str("error message here "))
    } else {
        Ok(())
    }
}
valkey_module! {
    configurations: [
        i64: [
            ["my_i64", &*CONFIG_I64, 10, 0, 1000, ConfigurationFlags::DEFAULT, Some(Box::new(on_configuration_changed)), Some(Box::new(on_i64_config_set::<ValkeyString, ValkeyGILGuard<i64>>))],
        ],
        ...
    ]
}
```

## Defrag

For memory-sensitive applications, defragmentation is essential.
The SDK now offers a safe and idiomatic Rust abstraction over the defrag API for custom data types.
The new `Defrag` struct abstracts away the raw C FFI calls.

```rust
static MY_VALKEY_TYPE: ValkeyType = ValkeyType::new(
    "mytype123",
    0,
    raw::RedisModuleTypeMethods {
        ...
        defrag: Some(defrag),
    },
);
unsafe extern "C" fn defrag(
    defrag_ctx: *mut raw::RedisModuleDefragCtx,
    _from_key: *mut RedisModuleString,
    value: *mut *mut c_void,
) -> i32 {
    let defrag = Defrag::new(defrag_ctx);
    ...
    0
}
valkey_module! {
    ...
    data_types: [
        MY_VALKEY_TYPE,
    ],
    ...
}
```

## Redis support

Need your module to work with both Valkey and recent versions of Redis?
The SDK includes a compatibility feature flag to ensure your module runs on both Valkey and Redis.
Specify `use-redismodule-api` so that module used RedisModule API Initialization for backwards compatibility.

```rust
[features]
use-redismodule-api = ["valkey-module/use-redismodule-api"]
default = []

cargo build --release --features use-redismodule-api
```

## Unit tests and memory allocation

This feature enables writing unit tests to run outside of Valkey or Redis.
Instead of using Valkey Allocator it relies on the System Allocator.  
Unit tests allow us to perform much more granular testing and execute much faster.  
The core logic lives in `alloc.rs` but developers only need to specify this feature in the module `Cargo.toml`.

```rust
[features]
enable-system-alloc = ["valkey-module/system-alloc"]

cargo test --features enable-system-alloc
```

## Conclusion

The Valkey Modules Rust SDK has seen exciting improvements over the past year, making it easier and more powerful to extend Valkey.
But we are not stopping.
Some of the ideas for future development include [mock context support for unit testing](https://github.com/valkey-io/valkeymodule-rs/issues/202), [enhanced context access within filters](https://github.com/valkey-io/valkeymodule-rs/issues/203), and [environment specific configs](https://github.com/valkey-io/valkeymodule-rs/issues/204) to streamline development and testing.
Additionally, the introduction of [crontab scheduling](https://github.com/valkey-io/valkeymodule-rs/issues/205) will allow executing custom logic on a defined schedules using `cron_event_handler`.

We hope this overview helped you understand how to leverage the SDK and inspired you to explore what's possible with Valkey modules.
Stay tuned for future updates.

We also want to express appreciation to the engineers who contributed to the SDK in the past year - [KarthikSubbarao](https://github.com/KarthikSubbarao), [dmitrypol](https://github.com/dmitrypol), [sachinvmurthy](https://github.com/sachinvmurthy), [zackcam](https://github.com/zackcam), [YueTang-Vanessa](https://github.com/YueTang-Vanessa), [hahnandrew](https://github.com/hahnandrew), [Mkmkme](https://github.com/Mkmkme).

## Useful links

* [Valkey repo](https://github.com/valkey-io/valkey)
* [Valkey Modules Rust SDK](https://github.com/valkey-io/valkeymodule-rs)
* [Rust in VS Code](https://code.visualstudio.com/docs/languages/rust)
