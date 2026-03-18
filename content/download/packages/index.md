+++
template = "packages.html"
title = "Package Repository"
description = "Install Valkey on Linux using official RPM and DEB packages"

[extra]
repo_url = "https://download.valkey.io/packaging"
gpg_key_url = "https://download.valkey.io/packaging/GPG-KEY-valkey.asc"

versions = ["9.0", "8.1", "8.0"]

[[extra.os_groups]]
label = "RHEL / Oracle Linux"
entries = [
  { value = "el8", name = "Oracle Linux 8 / RHEL 8", type = "rpm", pkg = "dnf" },
  { value = "el9", name = "Oracle Linux 9 / RHEL 9", type = "rpm", pkg = "dnf" },
  { value = "el10", name = "Oracle Linux 10 / RHEL 10", type = "rpm", pkg = "dnf" },
]

[[extra.os_groups]]
label = "Rocky Linux"
entries = [
  { value = "rocky8", name = "Rocky Linux 8", type = "rpm", pkg = "dnf" },
  { value = "rocky9", name = "Rocky Linux 9", type = "rpm", pkg = "dnf" },
  { value = "rocky10", name = "Rocky Linux 10", type = "rpm", pkg = "dnf" },
]

[[extra.os_groups]]
label = "AlmaLinux"
entries = [
  { value = "alma8", name = "AlmaLinux 8", type = "rpm", pkg = "dnf" },
  { value = "alma9", name = "AlmaLinux 9", type = "rpm", pkg = "dnf" },
  { value = "alma10", name = "AlmaLinux 10", type = "rpm", pkg = "dnf" },
]

[[extra.os_groups]]
label = "Amazon Linux"
entries = [
  { value = "amzn2023", name = "Amazon Linux 2023", type = "rpm", pkg = "dnf" },
]

[[extra.os_groups]]
label = "Fedora"
entries = [
  { value = "fedora39", name = "Fedora 39", type = "rpm", pkg = "dnf" },
  { value = "fedora40", name = "Fedora 40", type = "rpm", pkg = "dnf" },
  { value = "fedora41", name = "Fedora 41", type = "rpm", pkg = "dnf" },
]

[[extra.os_groups]]
label = "openSUSE"
entries = [
  { value = "opensuse-15.5", name = "openSUSE Leap 15.5", type = "suse", pkg = "zypper" },
  { value = "opensuse-15.6", name = "openSUSE Leap 15.6", type = "suse", pkg = "zypper" },
]

[[extra.os_groups]]
label = "Debian"
entries = [
  { value = "debian11", name = "Debian 11 (Bullseye)", type = "deb", pkg = "" },
  { value = "debian12", name = "Debian 12 (Bookworm)", type = "deb", pkg = "" },
  { value = "debian13", name = "Debian 13 (Trixie)", type = "deb", pkg = "" },
]

[[extra.os_groups]]
label = "Ubuntu"
entries = [
  { value = "ubuntu2204", name = "Ubuntu 22.04 (Jammy)", type = "deb", pkg = "" },
  { value = "ubuntu2404", name = "Ubuntu 24.04 (Noble)", type = "deb", pkg = "" },
]
+++
