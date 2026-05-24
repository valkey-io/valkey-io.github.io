---
title: "Valkey Bundle Getting Started Guide"
description: How to get started with Valkey Bundle
---

## What is Valkey Bundle

Valkey Bundle is a pre-packaged, containerized version of Valkey that comes preloaded with a collection of supported modules. 
These modules enable advanced data structures and search capabilities to extend Valkey’s core functionality. 
The bundle is designed to help developers quickly get started with powerful Valkey features without needing to manually install or configure anything. 
Some of the modules included in the bundle are:

1. [Valkey JSON](valkey-json.md) - Allows users to natively store, query, and modify JSON data structures using the JSONPath query language.
2. [Valkey Bloom](bloomfilters.md) - Provides space-efficient probabilistic data structures, such as Bloom filters, for adding elements and checking whether they exist in a set.
3. [Valkey Search](search.md) - Enables the creation of indexes and similarity searches through the use of complex filters.
4. [Valkey LDAP](ldap.md) - Handles user authentication against LDAP based identity providers.

# Quick Start to Using the Bundle

The fastest way to start using Valkey Bundle is by downloading the official image through [Docker Hub](https://hub.docker.com/r/valkey/valkey-bundle/). The following steps will guide you through launching and interacting with your first instance!

1. **Pull the image to get the latest public release**

    ```bash
    docker pull valkey/valkey-bundle
    ```

    This command downloads the most recent stable image of Valkey Bundle, which includes the Valkey server along with the preloaded modules.

    The Valkey Bundle image also supports multiple tags, allowing you to control the specific version and operating system base. This allows for more control over the environment, whether you’re aiming for a reproducible build (using a version like 8.1-bookworm) or a minimal footprint (alpine variant).

    Check out the [Valkey Bundle Docker Hub Tag](https://hub.docker.com/r/valkey/valkey-bundle/tags) section to view all available tags and example pull commands. 

2. **Start a Valkey container**

    ```bash
    docker run --name my-valkey-bundle -d -p 6379:6379 valkey/valkey-bundle
    ```

    This command starts a container named my-valkey-bundle and maps Valkey’s default port 6379 to your local machine for external access. By default, it uses the latest available image. To run a specific version or variant, append the desired tag to the image name. For example:

    ```bash
    docker run --name my-valkey-bundle -d -p 6379:6379 valkey/valkey-bundle:8.1.0-alpine
    ```
 
3. **Connect to the server using valkey-cli**
    
    To interact with the server, use the Valkey command-line interface (valkey-cli). You can run the CLI directly inside the running container using the following command:

    ```bash
    docker exec -it my-valkey-bundle valkey-cli -h localhost -p 6379 -3
    ```

    This launches an interactive valkey-cli session within the container and connects to the server via localhost.

4. **Try some commands**

    Check the available modules using the info command.
    ```bash
    my-valkey-bundle:6379> INFO modules
    # Modules
    module:name=bf,ver=10000,api=1,filters=0,usedby=[],using=[],options=[]
    module:name=search,ver=10000,api=1,filters=0,usedby=[],using=[],options=[handle-io-errors|handle-repl-async-load|no-implicit-signal-modified]
    module:name=json,ver=10010,api=1,filters=0,usedby=[],using=[],options=[handle-io-errors]
    module:name=ldap,ver=16777471,api=1,filters=0,usedby=[],using=[],options=[]
    ```

    Use the Valkey JSON Module
    ```bash
    > JSON.SET test $ '{"hello": "world"}'
    ```
    ```bash
    > JSON.GET test
    ```

    Use the Valkey Bloom Module
    ```bash
    > BF.RESERVE test_bloom 0.01 1000
    ```
    ```bash
    > BF.ADD test_bloom "item1"
    ```
    ```bash
    > BF.EXISTS test_bloom "item1"
    ```

    Use the Valkey Search Module
    ```bash
    > FT.CREATE idx SCHEMA description VECTOR HNSW 6 TYPE FLOAT32 DIM 3 DISTANCE_METRIC L2
    ```
    ```bash
    > HSET p1 description "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x80?"
    > HSET p2 description "\x00\x00\x00\x00\x00\x00\x80?\x00\x00\x00\x00"
    > HSET p3 description "\x00\x00\x80?\x00\x00\x00\x00\x00\x00\x00\x00"
    ```
    ```bash
    > FT.SEARCH idx "*=>[KNN 3 @description $vec]" PARAMS 2 vec "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x80?" DIALECT 2
    ```

    Use the Valkey LDAP Module
    ```bash
    > CONFIG SET ldap.servers "ldap://ldap.valkey.io:389"
    OK

    > CONFIG SET ldap.bind_dn_prefix "cn="
    OK

    > CONFIG SET ldap.bind_dn_suffix ",ou=users,dc=valkey,dc=io"
    OK
    ```
    ```bash
    > AUTH valkey "ldap_password"
    OK
    ```

    Make sure to check out the full list of commands for all the bundle components:

    1. [Valkey Commands](https://valkey.io/commands/)
    2. [Valkey JSON Commands](https://valkey.io/commands/#json)
    3. [Valkey Bloom Commands](https://valkey.io/commands/#bloom)
    4. [Valkey Search Commands](https://valkey.io/commands/#search)

Valkey Bundle supports more advanced setup options too including:

1. **Persistent storage**
    
    Persistent storage allows you to save data snapshots locally. The command below is an example of how you can save a snapshot every 60 seconds if at least one write occurred. 
    
    ```bash
    docker run --name my-valkey-bundle -d valkey/valkey-bundle valkey-server --save 60 1 --loglevel warning
    ```

    By default, Valkey logs are written to standard output and can be viewed using `docker logs`. Logs from all modules are included in the same stream since Valkey doesn't generate separate log files per module. If you prefer to log to a file, you can use the `--logfile` flag to specify a file path.
    
2. **Custom Flags with Environment Variable**
    
    This allows you to pass additional Valkey flags at runtime using the VALKEY_EXTRA_FLAGS environment variable. It is a flexible way to customize behavior without needing to modify the existing image or use a custom configuration file. 
    
    ```bash
    docker run --env VALKEY_EXTRA_FLAGS='--save 60 1 --loglevel warning' valkey/valkey-bundle
    ```

    In this example, the save flag enables data persistence while the loglevel warning flag limits log output to warnings and errors. You can include any [supported Valkey flags](https://github.com/valkey-io/valkey/blob/unstable/valkey.conf) in this variable to further tailor runtime behavior.
    
3. **Use a Custom Configuration File**
    
    If you need full control over your Valkey settings, you can create a custom configuration file and use it inside the container. 
    This allows you to override the default settings using your own valkey.conf file.

    First, ensure you have a valkey.conf file located in a local directory, such as /myvalkey/conf/valkey.conf. 
    The valkey.conf file can include any standard Valkey configuration directives such as memory limits, save intervals, logging levels, and more. The file has a very simple format:

    ```bash
    keyword arg1 arg2 ... argN
    ``` 

    Here is a sample configuration file that includes optimized settings for Valkey as well as the modules:

    ```bash
    # Valkey settings
    port 6379
    bind 127.0.0.1
    protected-mode yes
    requirepass "strong_password"

    ######################## JSON Module ########################
    # Maximum document size (in bytes, 0 = unlimited)
    json.max-document-size 1048576

    # Maximum nesting depth for JSON documents
    json.max-path-limit 32

    ######################## Bloom Module ########################
    # Default initial capacity for new bloom filters
    bf.bloom-capacity 100000

    # Default false positive rate
    bf.bloom-fp-rate 0.01

    # Memory usage limit per bloom filter (in bytes)
    bf.bloom-memory-usage-limit 134217728  # 128MB

    # Default expansion rate for scaling filters
    bf.bloom-expansion 2

    ######################## Search Module ########################
    # Thread configuration for search operations
    search.reader-threads 8
    search.writer-threads 4

    # HNSW graph configuration
    search.hnsw-block-size 10000

    # Enable cluster mode
    search.use-coordinator no

    # Log level (debug, verbose, notice, warning)
    search.log-level notice

    ######################## LDAP Module ########################
    # LDAP server configuration
    ldap.servers "ldap://primary:389,ldap://backup:389"
    ldap.auth_mode "search+bind"

    # TLS configuration
    ldap.use_starttls yes
    ldap.tls_ca_cert_path "/path/to/ca.crt"
    ldap.tls_cert_path "/path/to/client.crt"
    ldap.tls_key_path "/path/to/client.key"

    # Search+bind mode settings
    ldap.search_base "ou=users,dc=valkey,dc=io"
    ldap.search_filter "objectClass=person"
    ldap.search_attribute "uid"
    ldap.search_bind_dn "cn=readonly,dc=valkey,dc=io"
    ldap.search_bind_passwd "readonly_password"

    # Performance tuning
    ldap.connection_pool_size 5
    ldap.timeout_connection 5
    ldap.timeout_ldap_operation 3
    ldap.failure_detector_interval 1

    ######################## Common Settings ########################
    # Memory and performance
    maxmemory 4gb
    maxmemory-policy allkeys-lru

    # Persistence
    save 900 1
    save 300 10
    save 60 10000

    # Logging
    loglevel notice
    logfile "/var/log/valkey/valkey.log"
    ```

    Check out the [Configuration Documentation](valkey.conf.md) to learn more.

    After setting up the configuration file, run the container with a volume mount that maps your local directory into the container:
    
    ```bash
    docker run -v /myvalkey/conf:/usr/local/etc/valkey --name my-valkey-bundle valkey/valkey-bundle valkey-server /usr/local/etc/valkey/valkey.conf
    ```

    This command mounts your local configuration folder into the container and tells Valkey to start using your custom configuration file.

## Next Steps

Once you’ve set up the Valkey Bundle, it’s time to start exploring the modules. Check out the documentation for each one to learn what they can do and how to use them effectively.

1. [Valkey JSON Documentation](valkey-json.md)
2. [Valkey Bloom Documentation](bloomfilters.md)
3. [Valkey Search Documentation](search.md)
4. [Valkey LDAP Documentation](ldap.md)
