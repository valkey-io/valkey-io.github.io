+++
title = "Can Valkey handle transactions?"
weight = 3
[extra]
question = "Can Valkey handle transactions?"
category = "limitations"
+++

Yes, Valkey supports transactions through the `MULTI`, `EXEC`, `DISCARD`, and `WATCH` commands. However, these are not ACID transactions in the traditional database sense. Valkey transactions provide atomicity (all commands in a transaction are executed or none are) but not isolation (other clients can see intermediate states). 
