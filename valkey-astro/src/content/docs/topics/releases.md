---
title: "Releases and versioning schema"
description: How new versions of Valkey are released and supported
---

Valkey is usually among the most critical pieces of a software stack.
For this reason, Valkey's release cycle prioritizes highly stable releases at the cost of slower release cycles.

All Valkey releases are published in the [Valkey GitHub repository](https://github.com/valkey-io/valkey/releases).

## Versioning

Valkey stable releases will generally follow `major.minor.patch` [semantic versioning schema](https://semver.org/).
We follow semantic versioning to provide explicit guarantees regarding backward compatibility.

When discussing compatibility, we refer to the following API contracts:

1. Valkey commands including their inputs, outputs, and defined behavior
2. The functions and APIs that can be executed from a Lua script
3. The RDB version
4. The protocol used to establish and replicate data from primaries to replicas
5. The protocol between nodes within a Valkey cluster
6. The Valkey Module API interface
7. The AOF on disk format

### Patch versions

*Patch* versions are released with backwards compatible bug fixes and should not introduce new features.

Upgrading from a previous patch version should be safe and seamless.
It should be safe to run a primary-replica pair or a Valkey cluster with servers running on different patch versions.

*Patch* versions may also introduce small improvements such as performance or memory optimizations that are easy to verify as safe.

### Minor versions

*Minor* versions are released with new functionality that is added in a backward compatible manner.
Examples of new functionality include new commands, info fields, or configuration parameters.

Upgrading from a previous minor version should be safe, and will not introduce incompatibilities between servers in the cluster when default server configurations are used.

**NOTE:** Minor releases may include new commands and data types that can introduce incompatibility between servers in the cluster, but users need to opt-in to these features to cause this type of incompatibility.
For this reason, it is not recommended to run a Valkey cluster with servers running on different minor versions.
Users should avoid new features until all servers in the cluster have been upgraded.

Commands may also be marked as **deprecated** in minor versions.
Deprecated commands are not removed, instead a replacement command or an alternative to using the command will be defined in the same minor version.

### Major versions

*Major* versions are released with significant functionality that may break backwards compatibility or alter key performance characteristics.
Examples of significant functionality includes altering the behavior of an existing command, removing previously deprecated commands, changing the default value of configs, and significant refactoring for performance improvements.

Upgrading from a previous major version is intended to be safe, but should be approached with caution.
You should carefully read the release notes before performing a major version upgrade.
Although Major versions can introduce breaking changes, data replicated from primaries to replicas will always be sent in a backward compatible format.
You should always upgrade replicas before upgrading primaries in order to ensure data consistency.

The Valkey community strives to make as few backwards breaking changes as possible.
When breaking changes are required, we will also strive to provide a way to mitigate the impact without incurring downtime to your application.

## Release schedule

The Valkey community typically releases a stable major version once each year.
Stable minor versions are introduced as needed between major releases,
with at least one minor version published annually.

### Release candidate

New minor and major versions of Valkey begin by branching off the `unstable` branch as an initial release candidate branch with a name that takes the form of *`major.minor`*, example `7.2`.
The first release candidate, or rc1, is released once it can be used for development purposes and for testing the new version.
Release candidate versions will start with a patch version of "0" and will take the form *`major.minor.patch-rcN`*, example `7.2.0-rc1` followed by `7.2.0-rc2`.
At this stage, most of the new features and changes in the new version are ready for review, and the version is released for the purpose of collecting public feedback.
Subsequent release candidates are released every couple of weeks, primarily for fixing bugs and refining features based off of user input.

### Stable release

Once development has ended and the feedback for release candidate slows down, it is ready for the final release.
At this point, the release is marked as stable and is released with "0" as its patch-level version.

Patches are released as needed to fix high-urgency issues, or once a stable version accumulates enough fixes to justify it.

## Support

The latest stable release is always fully supported and maintained.

The Valkey community will provide maintenance support, providing patch releases for bug fixes and all security fixes, for 3 years from when a minor version was first released.

The Valkey community will also provide extended security support for the latest minor version of each major version for 5 years from when a version was first released.
The minor version to be used for this extended security support will be decided once the next major version has been launched.
The Valkey community will only patch security issues we believe to be possible to exploit, which will be up to the discretion of the TSC.

For contacting the TSC on sensitive matters and security issues, please see [SECURITY.md](https://github.com/valkey-io/valkey/blob/unstable/SECURITY.md).

### List of supported versions

| Version | Initial release | Maintenance support end | Security support end |
| -- | -- | -- | -- |
| 9.0 | 2025-10-21 | 2028-10-21 | 2028-10-21 |
| 8.1 | 2025-03-31 | 2028-03-31 | 2030-03-31 |
| 8.0 | 2024-09-15 | 2027-09-15 | 2027-09-15 |
| 7.2 | 2024-04-16 | 2027-04-16 | 2029-04-16 |

## Unstable tree

The development tree of Valkey is located in the `unstable` branch in the [Valkey GitHub repository](https://github.com/valkey-io/valkey).

This branch is the source tree where most of the new features are under development.
`unstable` is not considered production-ready: it may contain critical bugs, incomplete features, and is potentially unstable.

However, we try hard to make sure that even the unstable branch is usable most of the time in a development environment without significant issues.
