<!-- Thanks for contributing to valkey.io! Everything you need is in this template. -->

### What are you adding?

<!-- Name of the client, tool, or integration, and a one-line summary. -->

- [ ] Client library (`type: "clients"` → `_data/libraries/clients/`)
- [ ] Tool or framework (`type: "tools"` → `_data/libraries/integrations/`)
- [ ] AI or agent library (`type: "ai"` → `_data/libraries/integrations/`)

### Entry details

- **Name:**
- **Repository:**
- **License (SPDX):**
- **Maintained by the Valkey project (`isFirstParty`)?** yes / no

---

## How entries work

Each entry is a single flat JSON file under `_data/libraries/`, in one of two
group directories, and registered by path in `_data/libraries/manifest.json`:

- Client libraries → `_data/libraries/clients/` (appear on the **Clients** page)
- Tools & frameworks (`type: "tools"`) → `_data/libraries/integrations/`
- AI & agent libraries (`type: "ai"`) → `_data/libraries/integrations/`

Tools and AI libraries both live in `integrations/` and are shown together on
the **Integrations** page. To choose between them:

- `"tools"`: CLI and GUI apps, deployment and operations tooling, proxies and
  gateways, frameworks and ORMs, queues and background jobs, data-movement
  connectors, and observability or testing tools.
- `"ai"`: AI memory platforms, agent frameworks, vector stores, RAG and
  retrieval, and inference or serving engines.

The `type` value must match the directory the file lives in. Name the file
after your entry, lowercase and hyphenated (e.g. `valkey-glide-python.json`).
The CI build loads every file in the manifest and **fails on any malformed or
invalid entry**, so problems are caught before merge. To check before CI does,
run `zola build` with the Zola version CI uses (see
`.github/workflows/zola-deploy.yml`); no other repositories are needed.

## Fields

Entries are flat JSON objects. Use only the fields below — extra fields are
ignored by the templates and may fail review.

**Required for all entries:**

- `name` (string) — official name; also used to derive the card slug.
- `description` (string) — 1–2 factual, vendor-neutral sentences, at most 200 characters (the build fails above that).
- `type` (string) — exactly one of `"clients"`, `"tools"`, or `"ai"`, matching the directory.
- `license` (string) — SPDX identifier, e.g. `"Apache-2.0"`, `"MIT"`, `"BSD-3-Clause"`. Must be an OSI-approved open-source license.
- `repository` (string) — public source-code repository URL.
- `documentation` (string) — an `https://` link to a page that shows how to use the project with Valkey. Link the first of these that exists: a Valkey page in the project's docs, a Valkey example, a getting-started guide, or the README section that shows basic usage. For a library that speaks the Redis protocol, a page that shows the connection setup is enough. A homepage, a docs index, or a directory listing isn't. Link GitHub files at a tag or commit (`/blob/v1.2.3/…`), not a branch.
- `isFirstParty` (boolean) — `true` for repos under `github.com/valkey-io/`, otherwise `false`.

**Required for clients — `features` (9-character bit-string):**

A string of nine `"0"`/`"1"` characters; `"1"` means supported. Positions, in order:

| Position | Key | Feature |
| --- | --- | --- |
| 1 | `replica` | Replica reads |
| 2 | `backoff` | Retry & backoff |
| 3 | `pubsub` | Pub/Sub restoration |
| 4 | `scan` | SCAN family |
| 5 | `latency` | Low-latency routing |
| 6 | `az` | AZ affinity |
| 7 | `csc` | Client-side caching |
| 8 | `capa` | Advanced capabilities |
| 9 | `pool` | Connection pooling |

Example: `"111101000"` = replica, backoff, pubsub, scan, and az supported; the rest not.
The definition of each feature, as shown on the site, is in `featureDescriptions` in `_data/libraries/metadata.json`.
A feature that every listed client supports, or that none does, isn't shown on cards or in the legend, because it doesn't tell clients apart.
So a feature you set can appear or disappear as other clients are added or removed.

**Optional fields:**

- `language` (string) — primary language. Required in practice for clients and any library imported into code (ORM adapters, SDK wrappers, agent frameworks). Omit for standalone tools. If a library ships separate packages per language, create one entry per language.
- `tags` (array of strings) — for filtering and discovery. Clients use `["Clients"]`; tools and AI libraries use category tags. Use a tag already in use where one fits, and add a new one only if none does. Tags in use:
  - Clients: `["Clients"]`
  - Tools: `CLI & GUI`, `Deploy & operate`, `Frameworks & ORMs`, `Queues & background jobs`
  - AI: `RAG & retrieval`, `Agent memory`, `Agent frameworks`, `Inference & serving`
- `installCommand` (string) — primary install command, e.g. `"pip install valkey-glide"`.
- `isGlide` (boolean) — marks a Valkey GLIDE client.

## Example entries

Client (`_data/libraries/clients/valkey-glide-python.json`):

```json
{
  "name": "Valkey GLIDE Python",
  "language": "Python",
  "license": "Apache-2.0",
  "description": "Designed for reliability, optimized performance, and high-availability. GLIDE is a multi-language client with one shared Rust core and per-language bindings.",
  "repository": "https://github.com/valkey-io/valkey-glide/tree/main/python",
  "documentation": "https://glide.valkey.io/getting-started/quickstart/?lang=python",
  "isFirstParty": true,
  "installCommand": "pip install valkey-glide",
  "features": "111101000",
  "isGlide": true,
  "type": "clients",
  "tags": ["Clients"]
}
```

Integration (`_data/libraries/integrations/valkey-cli.json`):

```json
{
  "name": "valkey-cli",
  "language": "C",
  "license": "BSD-3-Clause",
  "description": "The interactive terminal client shipped with valkey-server, with cluster-aware routing, --scan, --bigkeys and latency diagnostics built in.",
  "repository": "https://github.com/valkey-io/valkey",
  "documentation": "https://valkey.io/topics/cli/",
  "isFirstParty": true,
  "type": "tools",
  "tags": ["CLI & GUI"]
}
```

## Register in the manifest

Add the file's path (relative to `_data/libraries/`) to the matching array in
`_data/libraries/manifest.json` — `clients` or `integrations`. List it exactly
once; manifest order is render order. A file not in the manifest will not appear
on the site.

---

### Submission checklist

- [ ] Valid JSON, placed in the directory matching its `type`, and registered once in `_data/libraries/manifest.json`.
- [ ] All required fields present: `name`, `description`, `type`, `license`, `repository`, `documentation`, `isFirstParty` — plus a 9-character `features` string for clients.
- [ ] Tested compatible with Valkey 7.2 or above.
- [ ] OSI-approved open-source license.
- [ ] Repository is publicly accessible, active within the last 6 months, and has a README with basic usage.
- [ ] `documentation` opens on a page that shows how to use the project with Valkey, not a homepage or an index.
- [ ] Description is factual, vendor-neutral and at most 200 characters, and every `features` flag and compatibility claim is accurate.
- [ ] Commits are signed per the DCO using `--signoff`.

By submitting this pull request, I confirm that my contribution is made under the terms of the BSD-3-Clause License.
