+++
title = "Pushing the limits of Valkey on a Raspberry Pi"
description = "While most people won't go to produciton on a Raspberry Pi we'll cover how to thoroughly performance test Valkey to understand how it will work in production."
date= 2024-10-21 01:01:01
authors= ["dtaivpp"]
+++

While doing extensive performance testing on a Raspberry PI is silly, it's made me realize the complexity of performance testing. For example, in some of the tests below I ended up managing to use all of the resources of the Raspberry Pi and achieved terrible performance. Every application has different performance characteristics so we'll walk though what factors to consider when it comes to deploying Valkey. 

## The test environment

![Picture of the Compute Module 4 credit Raspberry Pi Ltd (CC BY-SA)](images/cm4.png)

For hardware we are going to be using a Raspberry Pi [Compute Module 4 (CM4)](https://www.raspberrypi.com/products/compute-module-4/?variant=raspberry-pi-cm4001000). It's a single board computer (SBC) that comes with a tiny 1.5Ghz 4 core Broadcomm CPU and 8GB of system memory. This is hardly the first device someone would pick when deciding on a production system. Using the CM4 makes it easy to showcase how to optimize Valkey depending on your different hardware constraints.

Our operating system will be a 64-bit debian based operating system (OS) called [Rasbian](https://www.raspbian.org/). This distribution is specifically modified to perform well on the CM4. Valkey will run in a docker container orchestrated with docker compose. I like deploying in containers as it simplifies operations. If you'd like to follow along here is [a guide for installing Docker](https://docs.docker.com/engine/install/debian/). Make sure to continue to the [second page of the installation process](https://docs.docker.com/engine/install/linux-postinstall/) as well. It's easy to miss and skipping it could make it harder to follow along. 

We'll be using two CM4s for testing. The first will host Valkey and the second will host the benchmarking software. This setup probably better reflects how most people will run in production. Benchmarking is being done with redis-benchmark because it can be installed with `sudo apt install redis-tools`. Valkey does have it's own benchmark utility that is installed Valkey instance. To use valkey-benchmark instead you would need to install Valkey on the benchmarking server or spin up a container and connect into it. Functionally they both operate nearly the same as of the writing of this article. 

![Test architecture showing two nodes: a Benchmark server with the ip of 10.0.11.221 with an arrow pointing to a Valkey server with an ip of 10.0.1.136](images/test_setup.png)

## Setting up our environment

Below is a straightforward docker compose file that will start a single Valkey container. This container will bind Valkey to port 6379 on the host device. This means that is exposed to anyone with access to your network! This is important for us to access it from the benchmarking server. 

```yaml
# valkey.yaml
services:
  valkey-1:
    image: valkey/valkey:latest
    hostname: valkey1
    command: valkey-server --port 6379 --requirepass ${VALKEY_PASSWORD}
    volumes:
      - ./data:/data
    network_mode: host

volumes:
  data:
    driver: local
```

Since we are exposing this to our internal network we will create a password for our default user. I used `head -16 /dev/urandom | openssl sha1` to generate a random password. Because of how fast Valkey can process requests a brute force attack could try hundereds of thousands of passwords per second. After generating that password I put it in a `.env` file in the same directory as our docker compose. 

```bash
#.env
VALKEY_PASSWORD=e41fb9818502071d592b36b99f63003019861dad
```

Now by running `docker compose -f valkey.yaml up -d` Valkey server will start with password we set! 

## Baseline test

Now we are ready to do some baseline testing. We will log into the benchmarking server. If you haven't installed redis-benchmark yet you can do so with `sudo apt install redis-tools`.  

```bash
redis-benchmark -n 1000000 -t set,get -P 16 -q -a <PASSWORD FROM .env>  -h 10.0.1.136
```

Test breakdown:
- `-n` - this will run 1,000,000 operations using the commands set in -t
- `-t` - will run the set and get tests
- `-P` - this specifies that we would like the tests to use 16 pipelines (send 16 operations per request). 
- `-q` - silences the output to show only the final results
- `-a` - use the specified password
- `-h` - run the test against the specified host

Honestly, I was asonished by the first set of results I got. Sure, I expected Valkey to be fast but this speed from a single board computer?? ON A SINGLE THREAD?? Its amazing. 

```bash
redis-benchmark -n 1000000 -t set,get -P 16 -q -a e41fb9818502071d592b36b99f63003019861dad  -h 10.0.1.136
SET: 173040.33 requests per second, p50=4.503 msec                    
GET: 307031.00 requests per second, p50=2.455 msec
```

Between the two tests we averaged 240,000 requests per second with a median time of 3.45 msec (or 0.0034 seconds) for each operation. 

## Raising the CPU clock speed

Since Valkey is a single threaded application it makes sense that higher clock speeds would lead to more performance. I don't expect most people will overclock their servers in production. But different servers may be available with different CPU clock speeds. 

**Note:** Clock speeds generally are only comparable between CPU's with a similar architecture. For example, you could reasonably compare clock speeds between an 12th generation Intel i5 and a 12th generation Intel i7. If the 12th gen i7 had a max clock speed of 5Ghz that doesnt necessarily mean it will be slower than a AMD Ryzen 9 9900X clocked at 5.6Ghz. 

If you're following along on a Pi of your own I've outlined the steps to overclock your CM4 below. Otherwise you can skip to the results section below.

1. Open the below file in a text editor like nano.
    - `sudo nano /boot/firmware/config.txt`
2. At the end of the file add this section below the `[all]` tag.
    ```
    [all]
    over_voltage=8
    arm_freq=2200
    ```
3. Save with cmd + x, y, enter 
4. Restart the server and log back in `sudo restart now`

We've just increased the speed of the Pi by 47% by raising the clock speed from 1.5Ghz to 2.2Ghz. Now lets re-run our test and see how things look!

```bash 
redis-benchmark -n 1000000 -t set,get -P 16 -q -a e41fb9818502071d592b36b99f63003019861dad -h 10.0.1.136
SET: 394368.41 requests per second, p50=1.223 msec                    
GET: 438058.53 requests per second, p50=1.135 msec 
```

We're up to 416,000 requests per second with a 1.2 msec (0.0012s) median latency. The mathmaticians out there might notice that this speed up is a lot more than the expected 47% increase. It's a 73% increase in requests per second and a 65% improvement in processing time. Whats happening?!

While I haven't gone to machine code to verify here is what I believe is happening. The memory controller for the CM4 also lives on the CPU. Increasing the clock speed of the CPU also increases the performance of the memory. This means we almost are doubling the expected speedup by increasing the clock speed.

## Adding IO Threading

With all these gains I was super excited to try the new [IO threading available](https://valkey.io/blog/unlock-one-million-rps/) in Valkey 8. First we will take down the previous running docker instance with `docker compose -f valkey.yaml down`. Then we will modify the file to: 

```yaml
services:
  valkey-1:
    image: valkey/valkey:latest
    hostname: valkey1
    command: valkey-server --port 6379 --requirepass ${VALKEY_PASSWORD} --io-threads 5
    volumes:
      - ./data1:/data
    network_mode: host

volumes:
  data1:
    driver: local
```

Then we can `docker compose -f valkey.yaml up -d` to start it again. Remote into the benchmarking server to start the test and...?

```bash 
redis-benchmark -n 10000000 -t set,get -P 16 -q -a e41fb9818502071d592b36b99f63003019861dad -h 10.0.1.136
SET: 345494.75 requests per second, p50=0.911 msec                    
GET: 327858.09 requests per second, p50=0.879 msec  
```

Wait a second... These results are worse than the ones before? We went from 416k requests per second to 336k.... What's happening?

![A picutre of the valkey server with 4 cores represented as boxes. In each of the four core boxes there are other boxes. 2 cores have 1 IO Thread Box, 1 Core has 2 IO thread boxes, and the last one has 1 IO Thread box along with a Valkey Process box.](images/io_threads.png)

We have over-subscribed our CPU. This means we've created more worker threads than CPU cores. When a thread is under constant load it is competing with other threads on that core for resources. Not to mention they are also competing with the Valkey process for resources to read IO. 

That's why [Valkey recommends](https://github.com/valkey-io/valkey/blob/a62d1f177b7888ec88035a0a1ce600fbc2280ce7/valkey.conf#L1337-L1341) setting the number of threads to be a value less than the number of cores you have. For our little 4 core server lets set it to be 2 threads and try again.

```bash
redis-benchmark -n 10000000 -t set,get -P 16 -q -a e41fb9818502071d592b36b99f63003019861dad -h 10.0.1.136
SET: 609050.44 requests per second, p50=0.831 msec                    
GET: 521186.22 requests per second, p50=0.719 msec
```

Much better! Now we are seeing around 565,000 requests per second and 0.77 msec (0.0007s) latency for requests. Thats a 35% increase in performance across both metrics! Not to mention in the picture below you can see that we have 100% utilization across all of our CPU's which means there's no more room for improvement! 

![A picture of an HTOP window showing all four of our CPU's at 100% utilization.](images/io_threading_htop.png)

Right? Well believe it or not we can squeeze even more performance out of our little CM4! 

![A picture of our Valkey server with the 4 core boxes and to the right of them is a memory box. In the first core box is the Valkey process and in the next two there are IO Threads. The valkey process has a loop showing it communiacting with both of the IO threads. It also has a bracket showing it managing all the memory.](images/io_threading_arch.png)

Above is a representitive outline of what's happening on the server. The Valkey process has to take up valuble cycles managing the IO Threads. Not only that it has to perform a lot of work to manage all the memory assigned to it. That's a lot of work for a single process. 

## Clustered Valkey

![A picture of our Valkey server with the 4 core boxes and to the right of them is a memory box. In the first three core boxs are Valkey processes. Each of them has a bracket around a portion of the memory.](images/valkey_clustered.png)

What we are going to do is spin up a Valkey cluster. This cluster will have individual instances of Valkey runnning that each will be responsible for managing their own keys. With this method Valkey instaces are not waiting on IO threads to return data. They each read from their own IO and can access memory as soon as they get a request. 

I am not going into detail with how the keyspaces work but [here is a good 101 guide](https://valkey.io/topics/cluster-tutorial/) for understanding clustering in Valkey. 

Let's to stop our previous Valkey container. Now we can create our docker compose file for starting the cluster. There are a few things I want to point out here. Because each of these are exposed on the host they will all need to be using different ports. Additionally, all of them need to be aware they are started in cluster mode so they can redirect requests to the appropriate instance. 

```yaml
# valkey-cluster.yaml
services:
  valkey-node-1:
    hostname: valkey1
    environment: 
      - ALLOW_EMPTY_PASSWORD=yes
    image: valkey/valkey:latest
    command: valkey-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --requirepass ${VALKEY_PASSWORD}
    volumes:
      - ./data1:/data
    network_mode: host
  valkey-node-2:
    hostname: valkey2
    environment: 
      - ALLOW_EMPTY_PASSWORD=yes
    image: valkey/valkey:latest
    command: valkey-server --port 6380 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --requirepass ${VALKEY_PASSWORD}
    volumes:
      - ./data2:/data
    network_mode: host
  valkey-node-3:
    hostname: valkey3
    environment: 
      - ALLOW_EMPTY_PASSWORD=yes
    image: valkey/valkey:latest
    command: valkey-server --port 6381 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --requirepass ${VALKEY_PASSWORD}
    volumes:
      - ./data3:/data
    network_mode: host

volumes:
  data1:
    driver: local
  data3:
    driver: local
  data2:
    driver: local
```
Run `docker compose -f valkey-cluster.yaml up -d` to start the cluster. There is one more step to get the cluster running. First, find the name of one of your nodes with `docker ps --format '{{.Names}}'`. 

```bash
docker ps --format '{{.Names}}
kvtest-valkey-node-1-1
kvtest-valkey-node-3-1
kvtest-valkey-node-2-1
```

I'll use the first one to finish the cluster creation. Once the containers have started up we have to tell them the details they need to use for the cluster. Below I am using the IP of the host and the port configurations of all the containers to create the cluster. This is because these addresses need to be accessible from the benchmarking or application servers. 

```bash
docker exec -it kvtest-valkey-node-1-1 valkey-cli --cluster create 10.0.1.136:6379 10.0.1.136:6380 10.0.1.136:6381 -a e41fb9818502071d592b36b99f63003019861dad
```

Once that command is run we can run our benchmark! We do need to add the `--cluster` flag as well as several threads to generate data fast enough. Also, because this is so fast I ended up moving from 1 million requests to 10 million requests. That way it has time to fully utilize all the resources. 

```bash
redis-benchmark -n 10000000 -t set,get -P 16 -q --threads 10 --cluster -a e41fb9818502071d592b36b99f63003019861dad -h 10.0.1.136 
Cluster has 3 master nodes:

Master 0: 219294612b44226fa32482871cf21025ff531875 10.0.1.136:6380
Master 1: e5d85b970551c27065f1552f5358f4add6114d98 10.0.1.136:6381
Master 2: 1faf3d0dd22e518eec11fd46c0de6ce18cd15cfe 10.0.1.136:6379

SET: 1122838.50 requests per second, p50=0.575 msec                     
GET: 1188071.75 requests per second, p50=0.511 msec  
```

**1,155,000 requests per second**. **0.543 msec (0.0005s) latency**. We've managed to double our requests per second and improved our latency by nearly 30% again. All this on a single board computer that's the size of a credit card. 

While this is far from what I would recommend for a production server these are the same steps I'd reccomend to someone evaluating Valkey. It's important to start testing with a single instance to start finding the optimal settings. Then you can begin to scale up your test by adding more compute. Some other areas I'd reccomend testing is with different pipelineing configurations or with the number of client connections that you anticipate you'd be using in production. If you enjoyed this read make sure to check out my blog [TippyBits.com](https://tippybits.com) where I post content like this on a regular basis. Stay curious my friends!
