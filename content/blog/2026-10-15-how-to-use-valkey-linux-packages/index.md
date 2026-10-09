+++
title = "How to use Valkey's new packages"
date = 2026-10-25
description = "Installing and using Valkey has never been easier. By using the official packages for Valkey, you ensure that updates, security patches, system integration, and integrity verification are all tied together in a simple solution."
authors = ["dragosandriciuc", "EvgeniyPatlan"]
[taxonomies]
blog_type = ["How-to"]
[extra]
featured = true
+++

Installing databases shouldn't require you to choose between convenience and control.
Valkey packages provide a straightforward way to install Valkey while keeping installation, updates, and system integration within your operating system's package management workflow.
You can manage Valkey alongside other software on your system without compiling it from source for every update.

The project started publishing official DEB and RPM packages with Valkey 9.1, and the repositories also carry earlier releases back to 7.2.

Let's look at why packages are useful, where you can get them, and how to install Valkey from the official package repositories.

## Why would I use packages?

Valkey offers you multiple installation paths:

- The [official Docker page](https://hub.docker.com/r/valkey/valkey/),
- The [official Valkey downloads page](https://valkey.io/download/),
- The [official Valkey Package Repository](https://valkey.io/valkey-release-automation/).

So how does this differ from going through the above options?

The obvious answer is that it's "easier".
The package repositories provide verified packages and a maintained distribution path for Valkey.
Using a package repository for Valkey rather than compiling it from source offers several advantages:

- Automated dependency management: the package manager handles dependencies required by the packaged Valkey installation.
- Streamlined updates and security patches: Instead of manually tracking releases and re-compiling the binaries, utilizing a repository allows you to update Valkey smoothly using standard system tools like `sudo apt upgrade` or `sudo dnf upgrade`.
- Cryptographic verification: packages pulled from official or trusted repositories (such as [Valkey Package Repository](https://valkey.io/valkey-release-automation/)) are digitally signed, so you can verify the packages come from the Valkey project and are unmodified.
- System integration: repository installations automatically set up system services, configure appropriate file permissions, and handle pathing for core components like [`valkey-server`](https://valkey.io/topics/server/) and [`valkey-cli`](https://valkey.io/topics/cli/).

The main benefits are ease of use and security.

The Valkey release automation also connects package releases with the wider Valkey release process.
It builds official binaries, uploads release artifacts, updates the hashes repository, and updates the container and Helm projects.

## Which package source to use

Choose the package source that matches your operational requirements:

| Requirement                                     | Package source to consider             |
| ----------------------------------------------- | -------------------------------------- |
| Get Valkey releases directly from the project   | [Official Valkey packages](https://valkey.io/valkey-release-automation/)               |
| Follow the distribution's lifecycle             | [Distribution packages](https://valkey.io/download/)                  |
| Get vendor support or an SLA                    | Vendor packages                        |
| Support specific architectures or older systems | Check vendor and distribution coverage |

## Install Valkey using packages

Valkey packages offer you a direct path from upstream to your system, independent of distro release timing.
To install the package:

1. Go to the [Valkey Package Repositories](https://valkey.io/valkey-release-automation/) website.
2. Select the Valkey version you wish to install and the operating system you use.
The package repositories currently provide packages starting with Valkey 7.2.
3. Follow the installation instructions presented in the documentation below to get Valkey up and running.

Note: We recommend you install the latest version of Valkey.

For example, to install Valkey 9.1 on Oracle Linux 10 / RHEL 10:

1. Import the GPG signing key:

    ```bash
    sudo rpm --import https://download.valkey.io/packaging/GPG-KEY-valkey.asc
    ```

2. Add the Valkey repository:

    ```bash
    sudo tee /etc/yum.repos.d/valkey.repo << 'EOF'
    [valkey]
    name=Valkey 9.1 Packages for Oracle Linux 10 / RHEL 10
    baseurl=https://download.valkey.io/packaging/valkey-9.1/rpm/el10/$basearch/
    enabled=1
    gpgcheck=1
    gpgkey=https://download.valkey.io/packaging/GPG-KEY-valkey.asc
    EOF
    ```

3. Install Valkey:

    ```bash
    sudo dnf makecache
    sudo dnf install valkey
    ```

4. Start Valkey:

    ```bash
    sudo systemctl enable --now valkey
    ```

5. Verify Valkey:

    ```bash
    valkey-server --version
    valkey-cli ping   # PONG
    ```

That's it! All packages are signed with Valkey's GPG key. Download the public key: [GPG-KEY-valkey.asc](https://valkey.io/valkey-release-automation/GPG-KEY-valkey.asc).

## What to do next

Valkey's RPM and DEB packages provide a standard way to install and maintain Valkey through your operating system's package manager. Try the official Valkey packages and share your feedback with the Valkey community on [GitHub](https://github.com/valkey-io/valkey).
You can also check the latest release on the [Download Latest](https://valkey.io/download/) page.
You can install Valkey by going to the official [Install Valkey](https://valkey.io/topics/installation/) documentation page.
