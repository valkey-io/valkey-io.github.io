+++
title = "Are Valkey on-disk snapshots atomic?"
weight = 2
[extra]
question = "Are Valkey on-disk snapshots atomic?"
category = "technical"
+++

Yes, the Valkey background saving process is always forked when the server is outside of the execution of a command, so every command reported to be atomic in RAM is also atomic from the point of view of the disk snapshot. 
