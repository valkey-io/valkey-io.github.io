+++
title = "What are the main limitations of Valkey?"
weight = 2
[extra]
question = "What are the main limitations of Valkey?"
category = "limitations"
+++

The main limitations of Valkey include:

* **Memory-based storage**: All data must fit in RAM, which limits the total dataset size to available memory.
* **Single-threaded command execution**: While I/O threading is available, commands are executed sequentially in the main thread.
* **No built-in authentication**: Authentication must be implemented at the application level or through network security.
* **Limited query capabilities**: Unlike SQL databases, Valkey doesn't support complex queries or joins.
* **No built-in backup**: Backup and recovery must be implemented using external tools or scripts. 
