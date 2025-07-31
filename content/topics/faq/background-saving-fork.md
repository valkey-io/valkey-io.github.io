+++
title = "Background saving fails with a fork() error on Linux?"
weight = 1
[extra]
question = "Background saving fails with a fork() error on Linux?"
category = "technical"
+++

Short answer: `echo 1 > /proc/sys/vm/overcommit_memory` :)

And now the long one:

The Valkey background saving schema relies on the copy-on-write semantic of the `fork` system call in modern operating systems: Valkey forks (creates a child process) that is an exact copy of the parent. The child process dumps the DB on disk and finally exits. In theory the child should use as much memory as the parent being a copy, but actually thanks to the copy-on-write semantic implemented by most modern operating systems the parent and child process will _share_ the common memory pages. A page will be duplicated only when it changes in the child or in the parent. Since in theory all the pages may change while the child process is saving, Linux can't tell in advance how much memory the child will take, so if the `overcommit_memory` setting is set to zero the fork will fail unless there is as much free RAM as required to really duplicate all the parent memory pages. If you have a Valkey dataset of 3 GB and just 2 GB of free memory it will fail.

Setting `overcommit_memory` to 1 tells Linux to relax and perform the fork in a more optimistic allocation fashion, and this is indeed what you want for Valkey.

You can refer to the [proc(5)][proc5] man page for explanations of the available values.

[proc5]: https://man7.org/linux/man-pages/man5/proc.5.html 
