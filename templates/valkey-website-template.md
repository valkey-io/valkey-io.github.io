---
title: "{version}"
date: {date}
extra:
    tag: "{version}"
    artifact_source: https://download.valkey.io/releases/
    artifact_fname: "valkey"
    container_registry:
        -
            name: "Docker Hub"
            link: https://hub.docker.com/r/valkey/valkey/
            id: "valkey/valkey"
            tags:
{tags}
    packages:

    artifacts:
        -   distro: focal
            arch:
                -   arm64
                -   x86_64
        -   distro: jammy
            arch:
                -   arm64
                -   x86_64
        -   distro: noble
            arch:
                -   x86_64
---

Valkey {version} Release