+++
title = "What happens when Valkey runs out of disk space?"
weight = 4
[extra]
question = "What happens when Valkey runs out of disk space?"
category = "limitations"
+++

When Valkey runs out of disk space, it will stop accepting write commands and return errors. The server will continue to serve read commands but won't be able to persist data to disk. It's important to monitor disk space and implement proper alerting to prevent this situation. 
