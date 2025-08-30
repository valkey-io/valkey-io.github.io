+++
[extra]
body_class=  "homepage"
sectionid= "homepage"
repos_heading= "Featured repositories"
github_org= "https://github.com/valkey-io"
github_org_text= "All repos in the Valkey GitHub organization"

headline= "Valkey: an open source, in-memory data store"
long_description= ""

[extra.hero]
headings = ["FAST.", "RELIABLE.", "OPEN SOURCE, FOREVER."]
subtitle = "Valkey is an open source (BSD) high-performance key/value datastore that supports a variety of workloads such as caching, message queues, and can act as a primary database. The project is backed by the Linux Foundation, ensuring it will remain open source forever."
button_text = "GET STARTED"
button_url = "/topics/quickstart"

[[extra.documentation_cards]]
title = "Install"
description = "Step-by-step instructions on how to install and configure Valkey for first-time users."
button_text = "See Installation Guide"
button_url = "/topics/installation"

[[extra.documentation_cards]]
title = "Usage guide"
description = "Detailed documentation on the various datatype supported by Valkey and best practices."
button_text = "Documentation by topic"
button_url = "/topics/"

[[extra.documentation_cards]]
title = "Valkey API"
description = "View the full list of Valkey commands including first party modules."
button_text = "Command Reference"
button_url = "/commands"

[[extra.documentation_cards]]
title = "Clients"
description = "Official Valkey client libraries include support for:"
features = ["Python", "Java", "Go", "Node.js", "PHP"]
button_text = "Learn More"
button_url = "/clients"

[[extra.download_ctas]]
text= "Get Valkey"
url=  "/download/"

[[extra.docs]]
url= "/docs/"
title= "Read the docs"



+++

## Documentation

Valkey can run as either a **standalone** daemon or in a **cluster**, with options for **replication** and **high availability**. Valkey natively supports a rich collection of datatypes, including **strings**, **numbers**, **hashes**, **lists**, **sets**, **sorted sets**, **bitmaps**, **hyperloglogs** and more.
You can operate on data structures in-place with an expressive collection of commands.
Valkey also supports native extensibility with built-in scripting support for **Lua** and supports **module** plugins to create new commands, data types, and more.
