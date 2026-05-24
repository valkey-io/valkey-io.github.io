---
title: "CLIENT GETNAME"
description: "CLIENT GETNAME command reference documentation"
---

The `CLIENT GETNAME` returns the name of the current connection as set by [`CLIENT SETNAME`](client-setname.md). Since every new connection starts without an associated name, if no name was assigned a null bulk reply is returned.
