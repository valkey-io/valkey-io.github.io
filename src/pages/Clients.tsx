import { Box, Container, Flex, Heading, Table, Tbody, Td, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import { FaCheck, FaTimes } from "react-icons/fa";
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import SbHero from '/src/assets/images/code-of-conduct-image.webp';

export const Clients = () => {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Clients' }
  ];

  return (
    <Container maxW="none" p={0} background={'#E9EBF8'}>
      <Breadcrumbs items={breadcrumbItems} />
      <Flex 
        gap={0} 
        minH={'100%'} 
        direction={{ base: 'column-reverse', md: 'row' }}
      >
        {/* Main Content */}
        <Box
          flex="1"
          background={'#E2E8F0'}
          padding={'4'}
          h={'calc(100vh - 120px)'}
          overflowX={'auto'}
        >
          <VStack spacing={6} align="stretch">
          <Box
            flex="1"
            background={'#fff'}
            padding={'6'}
            overflowX={'auto'}
            sx={{
              'h1': {
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'secondary.purple.500',
                mb: 2,
                mt: 4,
                '&:first-of-type': {
                  mt: 0
                }
              },
              'h2': {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'secondary.purple.500',
                mb: 2,
                mt: 4,
                '&:first-of-type': {
                  mt: 0
                }
              },
              'h3': {
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'secondary.purple.500',
                mb: 2,
                mt: 4,
                '&:first-of-type': {
                  mt: 0
                }
              },
              'a': {
                color: 'text.link',
                textDecor: 'underline'
              },
              'p': {
                color: 'gray.600',
                mb: 4
              },
              'ul': {
                listStylePosition: 'inside',
                color: 'gray.600',
                mb: 4
              },
              'li': {
                ml: 4
              },
              'pre': {
                background: '#000',
                color: '#fff',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px'
              }
            }}
          >
          
            <h1>Client Libraries</h1>
            <div>
                <p>This page offers an overview of recommended Valkey clients for various programming languages. A table of advanced features supported by the respective clients is provided, highlighting the unique advantages of one client over another.</p>
                <p>This page includes only clients which are regularly tested and recommended. However, it's important to note that other clients that support Redis OSS version 7.2 are compatible with Valkey 7.2 and above. To add your client to the list, please refer to <a href="https://github.com/valkey-io/valkey-doc/blob/main/clients/README.md">this link.</a></p>

            </div>

            <div>
                <h2>Table of Contents</h2>
                <ul>              
                    
                    <li><a href="#python">Python</a></li>
                    <li><a href="#node-js">Node.Js</a></li>
                    <li><a href="#java">Java</a></li>
                    <li><a href="#go">Go</a></li>
                    <li><a href="#php">PHP</a></li>
                    <li><a href="#feature-comparison-table">Feature Comparison Table</a></li>
                </ul>
                
                <div>
                    <h2 id="python">Python</h2>
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-glide">valkey GLIDE</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-glide/tree/main/python">valkey GLIDE</a></li>
                            <li><strong>Installation:</strong><code>pip install valkey-glide</code></li>
                            <li><strong>Version:</strong> v1.3.0</li>
                            <li><strong>Version Released:</strong> 2025-02-15</li>
                            <li><strong>Description:</strong> Valkey GLIDE is designed for reliability, optimized performance, and high-availability, for Valkey and Redis OSS based applications. GLIDE is a multi language client library, written in Rust with programming language bindings, such as Java, node.js and Python.</li>
                            <li><strong>License:</strong> Apache-2.0</li>
                        </ul>
                    </Box>                    
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-py">valkey-py</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-py">valkey-py</a></li>
                            <li><strong>Installation:</strong><code>pip install valkey</code></li>
                            <li><strong>Version:</strong> 6.1.0</li>
                            <li><strong>Version Released:</strong> 2025-02-11</li>
                            <li><strong>Description:</strong> The Python interface to the Valkey key-value store.</li>
                            <li><strong>License:</strong> MIT</li>
                        </ul>
                    </Box>
                    
                </div>
                
                <div>
                    <h2 id="node-js">Node.Js</h2>
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-glide">valkey GLIDE</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-glide/tree/main/node">valkey GLIDE</a></li>
                            <li><strong>Installation:</strong><code>npm install @valkey/valkey-glide</code></li>
                            <li><strong>Version:</strong> v1.3.0</li>
                            <li><strong>Version Released:</strong> 2025-02-15</li>
                            <li><strong>Description:</strong> Valkey GLIDE is designed for reliability, optimized performance, and high-availability, for Valkey and Redis OSS based applications. GLIDE is a multi language client library, written in Rust with programming language bindings, such as Java, node.js and Python.</li>
                            <li><strong>License:</strong> Apache-2.0</li>
                        </ul>
                    </Box>                    
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="iovalkey">iovalkey</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/iovalkey">iovalkey</a></li>
                            <li><strong>Installation:</strong><code>npm install iovalkey</code></li>
                            <li><strong>Version:</strong> v0.3.1</li>
                            <li><strong>Version Released:</strong> 2025-03-10</li>
                            <li><strong>Description:</strong> A robust, performance-focused and full-featured Redis client for Node.js.</li>
                            <li><strong>License:</strong> MIT</li>
                        </ul>
                    </Box>
                    
                </div>
                
                <div>
                    <h2 id="java">Java</h2>
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-glide">valkey GLIDE</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-glide/tree/main/java">valkey GLIDE</a></li>
                            <li>
                                <strong>Installation:</strong>
                                <ul>
                                    <li>
                                        Maven:
                                        <pre>{`<dependency>
  <groupId>io.valkey</groupId>
  <artifactId>valkey-glide</artifactId>
  <classifier>osx-aarch_64 OR linux-aarch_64 OR linux-x86_64</classifier> 
  <version>[1.0.0,2.0.0)</version>
</dependency>`}</pre>
                                    </li>
                                    <li>
                                        Gradle:
                                        <pre>{`//Choose the appropriate classifier 
implementation group: 'io.valkey', 
    name: 'valkey-glide', 
    version: '1.+', 
    classifier: 'osx-aarch_64 OR linux-aarch_64 OR linux-x86_64'`}</pre>
                                    </li>
                                </ul>
                            </li>
                            <li><strong>Version:</strong> v1.3.0</li>
                            <li><strong>Version Released:</strong> 2025-02-15</li>
                            <li><strong>Description:</strong> Valkey GLIDE is designed for reliability, optimized performance, and high-availability, for Valkey and Redis OSS based applications. GLIDE is a multi language client library, written in Rust with programming language bindings, such as Java, node.js and Python.</li>
                            <li><strong>License:</strong> Apache-2.0</li>
                        </ul>
                    </Box>                    
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-java">valkey-java</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-java">valkey-java</a></li>
                            <li>
                                <strong>Installation:</strong>
                                <ul>
                                    <li>
                                        Maven:
                                        <pre>{`<dependency>
  <groupId>io.valkey</groupId>
  <artifactId>valkey-java</artifactId>
  <version>LATEST</version>
</dependency>`}</pre>
                                    </li>
                                    <li>
                                        Gradle:
                                        <pre>implementation 'io.valkey:valkey-java:+'</pre>
                                    </li>
                                </ul>
                            </li>
                            <li><strong>Version:</strong> v5.3.0</li>
                            <li><strong>Version Released:</strong> 2024-08-08</li>
                            <li><strong>Description:</strong> valkey-java is Valkey's Java client, dedicated to maintaining simplicity and high performance.</li>
                            <li><strong>License:</strong> MIT</li>
                        </ul>
                    </Box>
                    
                </div>
                
                <div>
                    <h2 id="go">Go</h2>
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-glide">valkey GLIDE</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-glide/tree/main/python">valkey GLIDE</a></li>
                            <li><strong>Installation:</strong><code>go get github.com/valkey-io/valkey-glide/go</code></li>
                            <li><strong>Version:</strong> v1.3.0</li>
                            <li><strong>Version Released:</strong> 2025-02-15</li>
                            <li><strong>Description:</strong> Valkey GLIDE is designed for reliability, optimized performance, and high-availability, for Valkey and Redis OSS based applications. GLIDE is a multi language client library, written in Rust with programming language bindings, such as Java, node.js and Python.</li>
                            <li><strong>License:</strong> Apache-2.0</li>
                        </ul>
                    </Box>                    
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="valkey-go">valkey-go</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/valkey-io/valkey-go">valkey-go</a></li>
                            <li><strong>Installation:</strong><code>go get github.com/valkey-io/valkey-go</code></li>
                            <li><strong>Version:</strong> 1.0.55</li>
                            <li><strong>Version Released:</strong> 2025-02-03</li>
                            <li><strong>Description:</strong> A fast Golang Valkey client that does auto pipelining and supports server-assisted client-side caching.</li>
                            <li><strong>License:</strong> Apache-2.0</li>
                        </ul>
                    </Box>
                    
                </div>
                
                <div>
                    <h2 id="php">PHP</h2>
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="phpredis">phpredis</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/phpredis/phpredis">phpredis</a></li>
                            <li><strong>Installation:</strong><code>pecl install redis</code></li>
                            <li><strong>Version:</strong> 6.1.0</li>
                            <li><strong>Version Released:</strong> 2024-10-05</li>
                            <li><strong>Description:</strong>  A PHP extension for Redis, offering high performance and a native API.</li>
                            <li><strong>License:</strong> PHP-3.01</li>
                        </ul>
                    </Box>                    
                    
                    <Box border='1px solid' borderColor={'rgba(0,0,0,10%)'} p="6" borderRadius={'4'} mb={'6'}>
                        <h3 id="predis">predis</h3>
                        <ul>
                            <li><strong>Repo:</strong> <a href="https://github.com/predis/predis">predis</a></li>
                            <li><strong>Installation:</strong><code>composer require predis/predis</code></li>
                            <li><strong>Version:</strong> v2.3.0</li>
                            <li><strong>Version Released:</strong> 2024-11-21</li>
                            <li><strong>Description:</strong> A flexible and feature-complete Redis client for PHP.</li>
                            <li><strong>License:</strong> MIT</li>
                        </ul>
                    </Box>
                    
                </div>
            </div>

            <div>
                <h2 id="advanced-features-overview">Advanced Features Overview</h2>
                <ol>
                    <li>
                        <p><strong>Read from Replica</strong> - The ability to read data from a replica node, which can be useful for load balancing and reducing the load on the primary node. This feature is particularly important in read-heavy applications.</p>
                    </li>
                    <li>
                        <p><strong>Smart Backoff to Prevent Connection Storm</strong> - A strategy used to prevent connection storms by progressively updating the wait time between retries when attempting to reconnect to a Valkey server. This helps to reduce the load on the server during topology updates, periods of high demand or network instability.</p>
                    </li>
                    <li>
                        <p><strong>PubSub State Restoration</strong> - The ability to restore the state of Pub/Sub (publish/subscribe) channels after a client reconnects. This feature ensures that clients can continue receiving messages after disconnections or topology updates such as adding or removing shards, for both legacy Pub/Sub and sharded Pub/Sub. The client will automatically resubscribe the connections to the new node. The advantage is that the application code is simplified, and doesn't have to take care of resubscribing to new nodes during reconnects.</p>
                    </li>
                    <li>
                        <p><strong>Cluster Scan</strong> - This feature ensures that the user experience and guarantees for scanning a cluster are identical to those for scanning a single node. The SCAN function operates as a cursor-based iterator. With each command, the server provides an updated cursor, which must be used as the cursor argument in subsequent calls. A complete iteration with SCAN retrieves all elements present in the collection from start to finish. If an element exists in the collection at the beginning and remains until the end of the iteration, SCAN will return it. Conversely, any element removed before the iteration begins and not re-added during the process will not be returned by SCAN. A client supporting this feature ensures the scan iterator remains valid even during failovers or cluster scaling (in or out) during the SCAN operation.</p>
                    </li>
                    <li>
                        <p><strong>Latency-Based Read from Replica</strong> - This feature enables reading data from the nearest replica, i.e., the replica that offers the best latency. It supports complex deployments where replicas are distributed across various distances, including different geographical regions, to ensure data is read from the closest replica, thereby minimizing latency.</p>
                    </li>
                    <li>
                        <p><strong>AZ-Based Read from Replica</strong> - This feature enables reading data from replicas within the same Availability Zone (AZ). When running Valkey in a cloud environment across multiple AZs, it is preferable to keep traffic localized within an AZ to reduce costs and latency. By reading from replicas in the same AZ as the client, you can optimize performance and minimize cross-AZ data transfer charges. For more detailed information about this feature and its implementation, please refer to <a href="https://github.com/valkey-io/valkey/pull/700">this link.</a></p>
                    </li>
                    <li>
                        <p><strong>Client Side Caching</strong> - Valkey client-side caching is a feature that allows clients to cache the results of Valkey queries on the client-side, reducing the need for frequent communication with the Valkey server. This can significantly improve application performance by lowering latency, reducing the network usage and cost and reducing the load on the Valkey server.</p>
                    </li>
                    <li>
                        <p><strong><code>CLIENT CAPA redirect</code> Support</strong> - The <code>CLIENT CAPA redirect</code> feature was introduced in Valkey 8 to facilitate seamless upgrades without causing errors in standalone mode. When enabled, this feature allows the replica to redirect data access commands (both read and write operations) to the primary instance. This ensures uninterrupted service during the upgrade process. For more detailed information about this feature, please refer to <a href="https://github.com/valkey-io/valkey/pull/325">this link.</a></p>
                    </li>
                    <li>
                        <p><strong>Persistent Connection Pool</strong> - This feature enables the Valkey client to maintain a pool of persistent connections to the Valkey server, improving performance and reducing overhead. Instead of establishing a new connection for each request, the client can reuse existing connections from the pool, minimizing the time and resources required for connection setup.</p>
                    </li>
                </ol>

            </div>

            <div id="feature-comparison-table">
                <Heading color='secondary.purple.500' as={'h4'} fontSize={'20px'} mt='40px'>Feature Comparison Table</Heading>
                <Table size="sm" variant="striped">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Language</Th>
                      <Th>Read From Replica</Th>
                      <Th>Smart Backoff To Prevent Connection Storm</Th>
                      <Th>Pubsub State Restoration</Th>
                      <Th>Cluster Scan</Th>
                      <Th>Latency Based Read From Replica</Th>
                      <Th>AZ Based Read From Replica</Th>
                      <Th>Client Side Caching</Th>
                      <Th>Client Capa Redirect</Th>
                      <Th>Persistent Connection Pool</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>valkey GLIDE</Td>
                      <Td>python</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>valkey-py</Td>
                      <Td>python</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>valkey GLIDE</Td>
                      <Td>node.js</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>iovalkey</Td>
                      <Td>node.js</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>valkey GLIDE</Td>
                      <Td>java</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>valkey-java</Td>
                      <Td>java</Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>valkey GLIDE</Td>
                      <Td>go</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>valkey-go</Td>
                      <Td>go</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>phpredis</Td>
                      <Td>php</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>predis</Td>
                      <Td>php</Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaCheck color="green" />
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                      <Td>
                        <FaTimes color="red"/>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
            </div>
            </Box>

          </VStack>
        </Box>

        {/* Sidebar */}
        <Box 
          w={{ base: '100%', md: '25%' }}
          h={{ base: '250px', md: 'calc(100vh - 120px)' }}
          overflowX={'auto'} 
          backgroundColor={'#F2F0FA'}
          backgroundImage={SbHero}
          backgroundSize={'cover'}
          backgroundPosition={'center bottom'}
          p={4}
        >
        </Box>
        
      </Flex>
      
    </Container>
  );
}; 