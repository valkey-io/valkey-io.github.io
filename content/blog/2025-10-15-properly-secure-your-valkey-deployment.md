+++
title= "How to Properly Secure Your Valkey Deployment"
description = "Learn how to secure your Valkey deployment with defense in depth through network configuration, authentication, access controls, and operational best practices for production environments"
date= 2025-12-12 00:00:00
authors= [ "allenhelton"]

[extra]
featured = true
featured_image = "/assets/media/featured/random-06.webp"
+++

Most of the production security incidents I've helped debug started with misconfigurations rather than zero-days or sophisticated exploits.

Security misconfiguration ranks as A05 in the [OWASP Top 10:2021](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/), with 90% of applications tested showing some form of misconfiguration. That's staggering. And when it comes to infrastructure like Valkey, the stakes are even higher - your cache often sits at the heart of your application, touching every request.

Engineers really care about security - but it is easy to overlook some crucial settings. This is especially true in the cloud, where everything moves really fast. You spin up a Valkey instance inside your VPC, it works, and you move on to the next problem. VPC can lock down your network to the outsiders  - but I often see multiple teams being able to access the same VPC. This leaves systems vulnerable to insider threats as well as well intentioned people or microservices that just happen to have a bad day. But using default configurations or enabling unnecessary features can make systems [easy targets for attackers](https://socradar.io/redis-redishell-vulnerability-cve-2025-49844/).

Let's talk about how to actually secure a Valkey deployment. Not with a single magic bullet, but with layers that work together.

## Defense in Depth for Valkey

[Defense in depth](https://csrc.nist.gov/glossary/term/defense_in_depth) is a security principle where multiple layers of security controls protect against attack, eliminating or mitigating single points of compromise. For Valkey, this means building overlapping protections so no single misconfiguration leaves you completely exposed.

### Network Boundaries

This is your first line of defense. Valkey is designed to be accessed by trusted clients inside trusted environments. It should never be [directly exposed to the internet](https://ine.com/blog/cve-20220543-lua-sandbox-escape-in-redis).

This is where putting your Valkey node inside a VPC is necessary - but not sufficient. Security groups help reinforce access limitation to make sure that only services and people who are intended to access the cluster can do so. Your CI runners probably don't need direct cache access. Each service should have just the access it needs.

Modern infrastructure also handles TLS seamlessly. While it is unlikely that an attacker is sniffing your packets on your cloud network, it is best practice to have encryption in transit - even within your own network. Current server hardware barely notices the handshake overhead, and Valkey picked up its TLS support back in 2020, so you rarely have to trade performance for security here.

### Authentication and Authorization

Authentication adds a critical layer of resiliency. The authentication layer protects you if your firewall or other protections fail, unauthenticated clients still can't access your instance.

Valkey supports [two authentication methods](https://valkey.io/topics/security/#authentication): the newer ACL system (Access Control Lists) and the legacy `requirepass`. ACLs give you more flexibility by allowing you to create users with fine-grained permissions tailored to what each service actually needs. If you already have centralized identity wiring, Valkey's [LDAP integration](https://valkey.io/topics/ldap/) plugs into that source of truth so you aren't managing a separate credential store just for the cache.

### Command Surface and Runtime Protection

You can tighten security further by controlling which commands are available. Valkey's ACL system lets you create users with fine-grained command permissions tailored to what each service actually needs. For example, a caching service might only need read and write operations:

```bash
ACL SETUSER cache_writer on >strongpassword ~cached:* +get +set +del +expire
```
A monitoring service might only need read access:

```bash
ACL SETUSER monitor on >anotherpassword ~* +get +mget +info +ping
```

And your admin user can have full access while still being explicitly configured:

```bash
ACL SETUSER admin on >verystrongpassword ~* +@all
```

This principle of least privilege means that even if credentials are compromised, an attacker is limited to only the operations the user can perform. A read-only monitoring account can't flush your entire cache or modify configurations.

For most application clients, a solid baseline is `ACL SETUSER application on >password +@all -@dangerous -@scripting`, which keeps day-to-day commands available while stripping scripting and other dangerous categories that often lead to trouble.

Beyond command restrictions, focus on container-level privilege boundaries rather than dropping root inside the container.

The [official Valkey container image](https://hub.docker.com/r/valkey/valkey/) runs as root by default, which is standard practice. Container isolation provides the necessary security boundary, but the runtime still needs hardening. Restrict who can run or exec into containers, scope mounted volumes carefully, use read-only mounts for configuration files, and keep the image up to date.

These controls protect against container breakout and privilege escalation — the real risks in production environments.

### Operational Controls

Once Valkey is running, your operational posture determines how quickly you can detect and contain issues. Enable logging so you can see what's happening. Monitor for unusual patterns like sudden spikes in command execution, connections from unexpected sources, or commands that shouldn't be running in your environment.

Set resource limits in your configuration. Poorly written operations or runaway commands can impact your cache's availability. `maxmemory` stops misbehaving workloads from consuming the whole node, and if you touch `timeout`, prefer the unauthenticated variant; forcing disconnects on healthy clients usually just amplifies reconnect storms.

Observability is part of security! Logs and metrics turn silent failures into visible signals, and visibility is what buys you time to respond before small issues become incidents. Track authentication failures like `acl_access_denied_auth` specifically - they're usually the first sign someone is poking around where they shouldn't.

## The Real Reason for Layered Security

Anecdotally, I've seen too many teams implement authentication and feel like they're done. And authentication is great, it's an essential layer. But defense in depth means multiple layers of safeguards, not relying on any single control.

Here's a real scenario: You've enabled authentication. But then a developer accidentally pushes credentials into a public GitHub repo. Or a microservice inside your VPC gets compromised and its environment variables are exposed. Or credentials end up in application logs.

With layered security, network segmentation catches the GitHub leak. Monitoring catches the compromised service behaving oddly. ACLs limit what an attacker can do even with credentials.

Each layer catches what the others might miss. That's the strength of defense in depth.

## Your Security Checklist

Here's a good starting point:

* Review your network configuration: Are firewall rules scoped appropriately?
* Enable authentication: Use ACLs if your setup supports it, requirepass at minimum
* Audit your command surface: Create and apply role-based ACLs to limit access
* Run as non-root:  Create a dedicated user for Valkey
* Review your threat model: Who has access to your VPC? What are the realistic risks?

The [Valkey security documentation](https://valkey.io/topics/security/) has detailed implementation guidance for all of this.

## Security Is a Practice, Not a Checkbox

Infrastructure evolves. New services get added. Teams grow and change. Requirements shift.

Security works best when it's part of how we operate, not something we set up once and forget. Review your configurations regularly. Update your approach as your architecture changes. And if you're ever unsure, the community is here.

**P.S.** If you need help thinking through your Valkey security setup, reach out to me on [LinkedIn](https://linkedin.com/in/allenheltondev). I'm happy to talk through it.
