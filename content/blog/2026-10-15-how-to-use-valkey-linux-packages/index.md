+++
title = "How to use Valkey packages"
date = 2026-10-25
description = "Install Valkey from DEB and RPM repositories. Learn how to choose a package source, configure the repository, and verify the installation."
authors = ["dragosandriciuc", "evgeniypatlan"]
[taxonomies]
blog_type = ["How-to"]
[extra]
featured = true
featured_image = "/assets/media/featured/random-01.webp"
+++

Installing databases shouldn't require you to choose between convenience and control.
Valkey packages provide a straightforward way to install Valkey while keeping installation, updates, and system integration within your operating system's package management workflow.
You can manage Valkey alongside other software on your system without compiling it from source for every update.

The project started publishing Debian packages (DEB) and Red Hat Package Manager packages (RPM) with Valkey 9.1, and the repositories also carry earlier releases back to 7.2.

Let's look at why packages are useful, where you can get them, and how to install Valkey from the package repositories.

## Why would I use packages?

The Valkey project offers multiple installation paths:

- [Docker Hub](https://hub.docker.com/r/valkey/valkey/),
- [Valkey downloads page binaries](https://valkey.io/download/),
- [Valkey Package Repository](https://valkey.io/valkey-release-automation/).

So, how does the last one differ from the other options?

The package repositories provide verified packages and a maintained distribution path for Valkey.
Using a package repository for Valkey rather than compiling it from source offers several advantages:

- Automated dependency management: the package manager handles dependencies required by the packaged Valkey installation.
- Streamlined updates and security patches: Instead of manually tracking releases and re-compiling the binaries, utilizing a repository allows you to update Valkey smoothly using standard system tools like `sudo apt upgrade` or `sudo dnf upgrade`.
- Cryptographic verification: packages from the Valkey package repository are digitally signed, so you can verify the packages come from the Valkey project and are unmodified.
- System integration: repository installations automatically set up system services, configure appropriate file permissions, and handle pathing for core components like [`valkey-server`](https://valkey.io/topics/server/) and [`valkey-cli`](https://valkey.io/topics/cli/).

These advantages simplify installation, reduce the maintenance burden, and support good security practices.

The Valkey release automation also connects package releases with the wider Valkey release process.
It builds binaries, uploads release artifacts, updates the hashes repository, and updates the container and Helm projects.

## Which package source to use

Choose the package source that matches your operational requirements:

| Requirement                                     | Package source to consider             |
| ----------------------------------------------- | -------------------------------------- |
| Get Valkey releases directly from the project   | [Valkey packages](https://valkey.io/valkey-release-automation/)               |
| Follow the distribution's lifecycle             | [Distribution packages](https://repology.org/project/valkey/versions)  |
| Get vendor support or a service level agreement (SLA) | Vendor packages                        |
| Support specific architectures or older systems | Check vendor and distribution coverage |

## Install Valkey using packages

Valkey packages offer you a direct path from upstream to your system, independent of distro release timing.
To install the package:

1. Go to the [Valkey Package Repositories](https://valkey.io/valkey-release-automation/) website.
2. Select the Valkey version you wish to install and the operating system you use.
The package repositories provide packages starting with Valkey 7.2 as of October 2026.
3. Follow the installation instructions presented in the documentation below to get Valkey up and running.

For example, to install Valkey 9.1 on Oracle Linux 10 / Red Hat Enterprise Linux (RHEL) 10:

1. Import the GNU Privacy Guard (GPG) signing key:

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
    sudo systemctl enable --now valkey@default
    ```

5. Verify Valkey:

    ```bash
    valkey-server --version
    valkey-cli ping   # PONG
    ```

That's it!
All packages are signed with Valkey's GPG key. Download the public key: [GPG-KEY-valkey.asc](https://valkey.io/valkey-release-automation/GPG-KEY-valkey.asc).

## What to do next

Valkey's RPM and DEB packages provide a standard way to install and maintain Valkey through your operating system's package manager. Try the Valkey packages and share feedback about the package installation process in the [Valkey release automation repository](https://github.com/valkey-io/valkey-release-automation).
