---
title: "LOLWUT"
description: "LOLWUT command reference documentation"
---

The LOLWUT command displays the Valkey version: however as a side effect of doing so,
it also creates a piece of generative computer art that is different with each version of Valkey.

By default the `LOLWUT` command will display the piece corresponding to the current Valkey version,
however it is possible to display a specific version using the following form:

    LOLWUT VERSION 7 ... other optional arguments ...

Of course the "7" above is an example. Each LOLWUT version takes a different
set of arguments in order to change the output. The user is encouraged to
play with it to discover how the output changes adding more numerical
arguments.

LOLWUT wants to be a reminder that there is more in programming than just
putting some code together in order to create something useful. Every
LOLWUT version should have the following properties:

1. It should display some computer art. There are no limits as long as the output works well in a normal terminal display. However the output should not be limited to graphics (like LOLWUT 7 and 8 actually do), but can be generative poetry and other non graphical things.
2. LOLWUT output should be completely useless. Displaying some useful Valkey internal metrics does not count as a valid LOLWUT.
3. LOLWUT output should be fast to generate so that the command can be called in production instances without issues. It should remain fast even when the user experiments with odd parameters.
4. LOLWUT implementations should be safe and carefully checked for security, and resist to untrusted inputs if they take arguments.
5. LOLWUT must always display the Valkey version at the end.
