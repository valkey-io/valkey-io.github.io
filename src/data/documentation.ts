export interface DocumentationItem {
  text: string;
  url: string;
  description: string;
  content?: string;
}

export interface DocumentationSection {
  title: string;
  items: DocumentationItem[];
}

export interface DocumentationData {
  introduction: {
    description: string;
    links: Array<{ text: string; url: string }>;
    content?: string;
  };
}

export const documentationData: DocumentationData = {
  introduction: {
    description: "The Valkey documentation is managed in markdown files in the valkey-doc repository. It's released under the Creative Commons Attribution-ShareAlike 4.0 International license.",
    links: [
      {
        text: "Introduction",
        url: "/topics/introduction"
      }
    ],
    content: `
      <p>The Valkey documentation is managed in markdown files in the
      <a href="https://github.com/valkey-io/valkey-doc">valkey-doc repository</a>.
      It's released under the
      <a href="https://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International license</a>.</p>
      <p>What is Valkey? See <a href="/topics/introduction">Introduction</a>.</p>
      <h2 id="programming-with-valkey">Programming with Valkey</h2>
      <ul>
      <li><a href="/topics/commands/">The full list of commands</a>, with documentation for each of them.</li>
      <li><a href="/topics/data-types">Data types</a>: Keys are strings, but values can be of many different data types.</li>
      <li><a href="/topics/pipelining">Pipelining</a>: How to send multiple commands at once, saving on round trip time.</li>
      <li><a href="/topics/pubsub">Pub/Sub</a>: Using Valkey as a message broker using the Publish/Subscribe messaging system.</li>
      <li><a href="/topics/memory-optimization">Memory optimization</a>: Understand how Valkey uses RAM.</li>
      <li><a href="/topics/commands/expire">Expires</a>: How to set a Time To Live (TTL) on key so that it will be automatically removed from the server when it expires.</li>
      <li><a href="/topics/lru-cache">Valkey as an LRU cache</a>: How to configure Valkey as a cache with a fixed amount of memory and automatic eviction of keys.</li>
      <li><a href="/topics/transactions">Transactions</a>: Valkey's approach to atomic transactions.</li>
      <li><a href="/topics/client-side-caching">Client side caching</a>: How a client can be notified by the server when a key has changed.</li>
      <li><a href="/topics/notifications">Keyspace notifications</a>: Get notifications of keyspace events via Pub/Sub.</li>
      <li><a href="/topics/protocol">Protocol specification</a>: The client-server protocol, for client authors.</li>
      </ul>
      <h2 id="server-side-scripting-in-valkey">Server-side scripting in Valkey</h2>
      <ul>
      <li><a href="/topics/programmability">Programmability overview</a>: An overview of programmability in Valkey.</li>
      <li><a href="/topics/lua-api">Valkey Lua API</a>: The embedded <a href="https://lua.org">Lua 5.1</a> interpreter runtime environment and APIs.</li>
      <li><a href="/topics/eval-intro">Introduction to Eval Scripts</a>: An introduction about using cached scripts.</li>
      <li><a href="/topics/functions-intro">Introduction to Valkey Functions</a>: An introduction about using functions.</li>
      <li><a href="/topics/ldb">Debugging Lua scripts</a>: An overview of the native Valkey Lua debugger for cached scripts.</li>
      </ul>
      <h2 id="administration">Administration</h2>
      <ul>
      <li><a href="/topics/installation">Installation</a>: How to install and configure Valkey. This targets people without prior experience with Valkey.</li>
      <li><a href="/topics/cli">valkey-cli</a>: The Valkey command line interface, used for administration, troubleshooting and experimenting with Valkey.</li>
      <li><a href="/topics/server">valkey-server</a>: How to run the Valkey server.</li>
      <li><a href="/topics/valkey.conf">Configuration</a>: How to configure Valkey.</li>
      <li><a href="/topics/replication">Replication</a>: What you need to know to set up primary-replica replication.</li>
      <li><a href="/topics/migration">Migration</a>: How to migrate from Redis to Valkey.</li>
      <li><a href="/topics/persistence">Persistence</a>: Options for configuring durability using disk backups.</li>
      <li><a href="/topics/admin">Administration</a>: Various administration topics.</li>
      <li><a href="/topics/security">Security</a>: An overview of Valkey's security.</li>
      <li><a href="/topics/RDMA">RDMA</a>: An overview of RDMA support.</li>
      <li><a href="/topics/acl">Access Control Lists</a>: ACLs make it possible to allow users to run only selected commands and access only specific key patterns.</li>
      <li><a href="/topics/encryption">Encryption</a>: How to use TLS for communication.</li>
      <li><a href="/topics/signals">Signals Handling</a>: How Valkey handles signals.</li>
      <li><a href="/topics/clients">Connections Handling</a>: How Valkey handles clients connections.</li>
      <li><a href="/topics/sentinel">Sentinel</a>: Valkey Sentinel is one of the official high availability deployment modes.</li>
      <li><a href="/topics/releases">Releases</a>: Valkey's development cycle and version numbering.</li>
      </ul>
      <h2 id="valkey-cluster">Valkey Cluster</h2>
      <ul>
      <li><a href="/topics/cluster-tutorial">Cluster tutorial</a>: A gentle introduction to Valkey Cluster, a deployment mode for horizontal scaling and high availability.</li>
      <li><a href="/topics/cluster-spec">Cluster specification</a>: The more formal description of the behavior and algorithms used in Valkey Cluster.</li>
      </ul>
      <h2 id="valkey-modules-api">Valkey modules API</h2>
      <ul>
      <li><a href="/topics/modules-intro">Introduction to Valkey modules</a>: Extend Valkey using dynamically linked modules.</li>
      <li><a href="/topics/modules-native-types">Implementing native data types</a>: Modules scan implement new data types (data structures and more) that look like built-in data types. This documentation covers the API to do so.</li>
      <li><a href="/topics/modules-blocking-ops">Blocking operations</a>: Write commands that can block the client (without blocking Valkey) and can execute tasks in other threads.</li>
      <li><a href="/topics/modules-api-ref">Modules API reference</a>: Documentation of all module API functions. Low level details about API usage.</li>
      </ul>
      <h2 id="performance">Performance</h2>
      <ul>
      <li><a href="/topics/latency-monitor">Latency monitoring</a>: Integrated latency monitoring and reporting help tuning for low latency.</li>
      <li><a href="/topics/benchmark">valkey-benchmark</a>: The benchmarking tool shipped with Valkey.</li>
      <li><a href="/topics/performance-on-cpu">On-CPU profiling and tracing</a>: How to find on-CPU resource bottlenecks.</li>
      </ul>
      <h2 id="tutorials-faq">Tutorials &amp; FAQ</h2>
      <ul>
      <li><a href="/topics/quickstart">Quick start</a>: Get started with Valkey.</li>
      <li><a href="/topics/mass-insertion">Mass insertion of data</a>: How to add a big amount of data to a Valkey instance in a short time.</li>
      <li><a href="/topics/distlock">Distributed locks</a>: Implementing a distributed lock manager.</li>
      <li><a href="/topics/indexing">Secondary indexes</a>: How to simulate secondary indexes, composed indexes and traverse graphs using various data structures.</li>
      <li><a href="/topics/ARM">ARM and Raspberry Pi</a>: ARM and the Raspberry Pi are supported platforms. This page contains general information and benchmarks.</li>
      <li><a href="/topics/twitter-clone">Writing a simple Twitter clone with PHP and Valkey</a></li>
      <li><a href="/topics/problems">Troubleshooting</a>: Problems? Bugs? High latency? Other issues? Use our problems troubleshooting page as a starting point to find more information.</li>
      <li><a href="/community/faq">FAQ</a>: Frequently asked questions.</li>
      </ul>
      <h2 id="command-runtime-introspection">Command runtime introspection</h2>
      <ul>
      <li><a href="/topics/key-specs">Command key specifications</a>: How to extract the names of keys accessed by every command.</li>
      <li><a href="/topics/command-tips">Command tips</a>: Command tips communicate non-trivial execution modes and post-processing information about commands.</li>
      <li><a href="/topics/command-arguments">Command arguments</a>: An overview of command arguments as returned by the <code>COMMAND DOCS</code> command.</li>
      </ul>
    `
  }
};
