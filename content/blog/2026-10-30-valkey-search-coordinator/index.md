+++
title = "Using Valkey Search in a Cluster Deployment"
date = 2026-10-30
description = "A getting started guide on using the Valkey Search module in a Valkey Cluster setup"
authors = ["hieun"]

[taxonomies]
blog_type = ["How-to"]

[extra]
+++

[Valkey-search](https://github.com/valkey-io/valkey-search) brings powerful full-text and vector search capabilities to Valkey databases,
but running it in a cluster deployment has challenges such as how to synchronize index definitions and searching for data
when each node only holds a portion of the whole dataset.
In this blog post, we will analyze the role of the Coordinator service to help you seamlessly integrate valkey-search into your cluster infrastructure.

## How does Valkey-search work

Before we get into how valkey-search works in a cluster, let's go over how it operates in a single instance setup first.
When an index is created using [`FT.CREATE`](https://valkey.io/commands/ft.create),
it subscribes to keyspace events so that when a key is created or updated, the index receives the relevant information to update accordingly.
For example, with an index created using the following command:

```plaintext
FT.CREATE index SCHEMA color TAG city TAG
```

When a new hash key is created ([`HSET key hello world`](https://valkey.io/commands/hset)), valkey-search will receive the information from the keyspace event subscription.
We can get the same info by running [`PSUBSCRIBE`](https://valkey.io/commands/psubscribe) [through `valkey-cli`](https://valkey.io/topics/notifications/)

```bash
valkey-cli config set notify-keyspace-events KA
# run HSET key hello world in another terminal
valkey-cli --csv psubscribe '__keyspace*__:*'
"pmessage","__keyspace*__:*","__keyspace@0__:key","hset"
```

The module will then start reading the key to see whether it can be added to the index by
checking whether the hash contains fields declared in the index’s schema
(in this case, our key example will not be indexed, since the only field it has is `hello`).

## Working in a cluster environment

Like with other objects in a Valkey cluster, when you create an index, it is only created on the node you are currently connected to. For example, in a 3-node cluster:

```shell
valkey-cli -c -p 30001 CLUSTER NODES
78e5eafeff420ed4b72b9393dced84b0a73fda9d 127.0.0.1:30002@40002 master - 0 1792479585890 2 connected 5461-10922
0cb15db59d612112eda0555ef923ec908f88602c 127.0.0.1:30003@40003 master - 0 1792479585476 3 connected 10923-16383
7aeb0ad0646e2d835d131c5f49dd5734cb97ec4e 127.0.0.1:30001@40001 myself,master - 0 0 1 connected 0-5460
```

When we create an index, it is only present on the node we are currently connected to (port 30001):

```shell
# create an index on node 1

valkey-cli -c -p 30001 FT.CREATE index SCHEMA color TAG city TAG

# listing indexes on each node

for i in {1..3}; do
 echo "Indexes on node 3000${i}: `valkey-cli -c -p "3000${i}" FT._LIST`"
done
"Indexes on node 30001: 1) index"
"Indexes on node 30002: (empty array)"
"Indexes on node 30003: (empty array)"
```

We can run the `FT.CREATE` command again on each node in the cluster so that the index is present on every node.
But then, when running [`FT.SEARCH`](https://valkey.io/commands/ft.search), it will again only return data local to each node:

```shell
# add some keys so that the index has data
valkey-cli -c -p 30001 HSET key1 color "green, blue" city "San Jose"
valkey-cli -c -p 30001 HSET key2 color black city "Seattle"
valkey-cli -c -p 30001 HSET key3 color green city "New York, Barcelona, Kiev"
valkey-cli -c -p 30001 HSET key4 color beige city " Taipei , Bangkok "
valkey-cli -c -p 30001 HSET key5 color "beige,green" city " Cairo, Tel Aviv"
valkey-cli -c -p 30001 HSET key6 color "hello world, green is my heart"

# run FT.SEARCH on node 1
valkey-cli -c -p 30001 FT.SEARCH index "@color:{green}" RETURN 1 color
1) (integer) 1
2) "key3"
3) 1) "color"
   2) "green"

# FT.SEARCH on node 2

valkey-cli -c -p 30002 FT.SEARCH index "@color:{green}" RETURN 1 color
1) (integer) 2
2) "key1"
3) 1) "color"
   2) "green, blue"
4) "key5"
5) 1) "color"
   2) "beige,green"
```

## The Coordinator Service

To address this problem, valkey-search has an additional component named Coordinator. As the name implies, it will coordinate cluster nodes so that valkey-search operations are synchronized, and the client won’t have to run a command on each node. You can run the valkey-search module in cluster mode by enabling the config `search.use-coordinator`. This is a hidden config, however, so we need to set it inline with the `loadmodule` config, instead of setting it as a separate line:

```plaintext
loadmodule /usr/lib/valkey/libsearch.so --use-coordinator
```

Below is a sample Docker Compose file to create 3 valkey-server instances using the valkey-bundle image with the valkey-search module running with Coordinator enabled.
We need to use `entrypoint` here instead of the normal `command`
because the valkey-bundle image comes with its own entrypoint script,
which automatically loads the preinstalled modules, and will override our custom `loadmodule` directive:

```yaml
---
networks:
  vk-search-nw: {}
x-service-defaults: &default-config
  image: valkey/valkey-bundle:9.1
  entrypoint:
    [
      "valkey-server",
      "--protected-mode no",
      "--loadmodule /usr/lib/valkey/libsearch.so --use-coordinator",
      "--appendonly yes",
      "--cluster-enabled yes",
      "--cluster-config-file /data/nodes.conf",
    ]
services:
  vk1:
    <<: *default-config
    container_name: vk1
  vk2:
    <<: *default-config
    container_name: vk2
  vk3:
    <<: *default-config
    container_name: vk3
```

After all the containers are up, issue the cluster create command:

```shell
# Start the containers
docker compose up -d

# Create the cluster
docker exec -ti vk1 valkey-cli --cluster create vk1:6379 vk2:6379 vk3:6379 --cluster-replicas 0
```

You can verify that the Coordinator service has been started by checking the container’s log for the line `Coordinator Server listening on`.
The port it uses is <valkey port + 20294>. So in this example, it is 26673:

```shell
docker logs vk1 | grep -i 'Coordinator Server listening'
<search> [notice], tid: 281473449222176, /src/coordinator/server.cc:430: Coordinator Server listening on [::]:26673
```

Now, when creating an index, it will be automatically propagated to other nodes in the cluster:

```shell
# Create the index on node 1
docker exec vk1 valkey-cli -c FT.CREATE index SCHEMA color TAG city TAG
OK

# List indexes on each node
for i in {1..3}; do
    echo "Indexes on node vk${i}: `docker exec vk${i} valkey-cli FT._LIST`"
done
"Indexes on node vk1: index"
"Indexes on node vk2: index"
"Indexes on node vk3: index"
```

`FT.SEARCH` outputs will also be merged from each node, so we only need to run it once:

```shell
docker exec vk1 valkey-cli -c FT.SEARCH index "@color:{green}" RETURN 1 color
1) (integer) 3
2) "key5"
3) 1) "color"
   2) "beige,green"
4) "key3"
5) 1) "color"
   2) "green"
6) "key1"
7) 1) "color"
   2) "green, blue"
```

## How the Coordinator communicates between instances

If enabled, Coordinator will start a gRPC server to communicate between primaries. When an index is created or modified,
the node receiving `FT.CREATE` will notify other primaries through the cluster bus. The other primaries will then get the new index's definition through the gRPC server.
After the primaries created the index, they will send `FT.INTERNAL_UPDATE` through the replication stream (and AOF if persistence is enabled) so that their replicas can also create the index.

Since the data sent through gRPC and AOF are the same, we can read the AOF file to see what data is being sent between nodes.
The 3 parameters of `FT.INTERNAL_UPDATE` are the index name (which also includes the database number if it is >0),
`GlobalMetadataEntry` (the index's definition retrieved through gRPC) , and `GlobalMetadataVersionHeader` (the index's version header sent through cluster bus).
Since the data is being sent in protobuf message format, it is not human-readable:

```bash
cat appendonly.aof.1.incr.aof
FT.INTERNAL_UPDATE
$13
idx:{bicycle}
$407
<binary data>
$17
<binary data>
```

But with some simple Python scripting, we can see what data these `FT.INTERNAL_UPDATE` commands are sending:

- First, we need to convert the protobuf schemas ([`coordinator.proto`](https://github.com/valkey-io/valkey-search/blob/main/src/coordinator/coordinator.proto) and [`index_schema.proto`](https://github.com/valkey-io/valkey-search/blob/main/src/index_schema.proto)) used by the module into Python classes:

```shell
# download the schema files from GitHub repo
URL_BASE_PATH="https://raw.githubusercontent.com/valkey-io/valkey-search/refs/heads/main/src"
wget "${URL_BASE_PATH}/coordinator/coordinator.proto" -O coordinator.proto
wget "${URL_BASE_PATH}/index_schema.proto" -O index_schema.proto

# convert them to Python classes at current directory
protoc --proto_path=. --python_out=. coordinator.proto
protoc --proto_path=. --python_out=. index_schema.proto

# get the AOF file from inside the container 
docker cp vk1:/data/appendonlydir/appendonly.aof.1.incr.aof .
```

- Then parse the message written in the AOF file using the below Python script:

```python
import re
import json
from google.protobuf.json_format import MessageToJson
import coordinator_pb2  
import index_schema_pb2  

def extract_bin(aof):
  """Extract the protobuf binary message from AOF"""
  # regex pattern to get the parameter value length
  pattern = rb"\$(\d+)\r\n"
  output = []
  match = re.search(pattern, aof)
  while match is not None:
    p_len = match.group(1)
    byte_offset = 3 + len(p_len)
    output.append(aof[byte_offset: byte_offset + int(p_len)])
    aof = aof[byte_offset + int(p_len) + 2:]
    match = re.search(pattern, aof)
  return output

# read the AOF file as byte array
with open("./appendonly.aof.1.incr.aof", "rb") as f:
    content = f.read()  
# split the AOF file by FT.INTERNAL_UPDATE commands 
content = content.split(b"$18\r\nFT.INTERNAL_UPDATE\r\n")[1:]

mt_entry = coordinator_pb2.GlobalMetadataEntry()
mt_header = coordinator_pb2.GlobalMetadataVersionHeader()

for c in content:
  params = extract_bin(c)
  # GlobalMetadataEntry protobuf message is the second parameter
  mt_entry.ParseFromString(params[1])
  # GlobalMetadataVersionHeader protobuf message is the third parameter
  mt_header.ParseFromString(params[2])
  print("# GlobalMetadataEntry:")
  print(mt_entry)
  print("# GlobalMetadataVersionHeader:")
  print(mt_header)
  # the index definition is nested inside GlobalMetadataEntry
  # index_schema = index_schema_pb2.IndexSchema()
  # index_schema.ParseFromString(mt_entry.content.value)
```

So we can see that the Coordinator syncs the data between nodes by sending Protobuf messages about the IndexSchema so that other nodes can replicate the object, as well as some additional information about the message metadata, so it won’t mistakenly apply obsolete information:

```markdown
# GlobalMetadataEntry:
fingerprint: 11620754165290179806
encoding_version: 66049
content {
  type_url: "type.googleapis.com/valkey_search.data_model.IndexSchema"
  value: "\n\005index...."
}

# GlobalMetadataVersionHeader:
top_level_fingerprint: 6020290978218369518
top_level_version: 1
top_level_min_version: 65536
```

### What data is being sent when querying

Similarly, when running `FT.SEARCH`, the Coordinator will send protobuf messages to other nodes containing the query parameters so that each node can perform searches on its own shard of the index. These partial results are then merged and returned to the client.

## Conclusion

Deploying valkey-search in a cluster environment allows you to scale your search workloads seamlessly without giving up the ease of a single-node configuration. With just a simple update to your `loadmodule` config, valkey-search handles index synchronization across cluster nodes automatically and efficiently aggregates query results. Try it out and share your feedback or contribute to [Valkey Search on GitHub](https://github.com/valkey-io/valkey-search).
