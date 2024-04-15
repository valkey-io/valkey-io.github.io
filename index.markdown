---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: homepage
body_class: homepage
sectionid: homepage

download_ctas:
  - text: Get Valkey
    url: "/download/"

docs:
    url: '/docs/'
    title: "Read the docs"

repos_heading: "Featured repositories"
github_org: "https://github.com/valkey-io"
github_org_text: "All repos in the Valkey GitHub organization"

headline: "Valkey: an open source, in-memory data store"

long_description: ""
    
sidebar:
    -
        title: Founding documents
        links:
            -
                title: 'Linux Foundation Launches Open Source Valkey Community'
                url: https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community

---

Valkey is an open source (BSD) high-performance key/value datastore that supports a variety workloads such as **caching**, **message queues**, and can act as a **primary database**.
Valkey can run as either a **standalone** daemon or in a **cluster**, with options for **replication** and **high availability**.

In Valkey, data is accessed with keys and you model your information into **data structures**. You can operate on data structures in-place with a expressive collection of commands: no need for extra round trips or client process. Valkey has support for **strings**, **numbers**, **hashes**, **lists**, **sets**, **sorted sets**, **bitmaps**, **hyperloglogs** and more.

You can also use Valkey to structure and distribute messages with the fire-and-forget simplicity of **built-in pub/sub messaging**. Valkey also has **streams**, a log-like structure that allows you to durably process information with multiple producers and across many consumers with a poll-free, zero wait mechanism. 

You can script Valkey with a **built-in Lua** interpreter to optimize and finely control complex operations. 
It also has a built-in **module extensibility API** that enables you to create new data types and commands that can exploit the full power of the storage engine and protocol.

Valkey commands operate atomically and you can ensure atomicity across multiple keys and commands with **lock-free transactions**.

You can use Valkey as a **database**, **cache**, **message broker**, and **message queue** as well as a storage engine for **session management**, **leaderboards**, **rate limiters**, and **real-time analytics workloads**.

---

**Get Started**: Join the vibrant Valkey community and check out the code on [GitHub](https://github.com/valkey-io/valkey).
