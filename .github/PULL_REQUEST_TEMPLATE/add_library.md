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
the **Integrations** page. The `type` value must match the directory the file
lives in. Name the file after your entry, lowercase and hyphenated
(e.g. `valkey-glide-python.json`). The CI build loads every file in the manifest
and **fails on any malformed or invalid entry**, so problems are caught before merge.

## Fields

Entries are flat JSON objects. Use only the fields below — extra fields are
ignored by the templates and may fail review.

**Required for all entries:**

- `name` (string) — official name; also used to derive the card slug.
- `description` (string) — 1–2 factual, vendor-neutral sentences, ideally under ~200 characters.
- `type` (string) — exactly one of `"clients"`, `"tools"`, or `"ai"`, matching the directory.
- `license` (string) — SPDX identifier, e.g. `"Apache-2.0"`, `"MIT"`, `"BSD-3-Clause"`. Must be an OSI-approved open-source license.
- `repository` (string) — public source-code repository URL.
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

**Optional fields:**

- `language` (string) — primary language. Required in practice for clients and any library imported into code (ORM adapters, SDK wrappers, agent frameworks). Omit for standalone tools. If a library ships separate packages per language, create one entry per language.
- `tags` (array of strings) — for filtering and discovery. Clients use `["Clients"]`; tools and AI libraries use category tags. Prefer an existing tag:
  - Clients: `["Clients"]`
  - Tools: `CLI & GUI`, `Deploy & operate`, `Proxies & gateways`, `Frameworks & ORMs`, `Queues & background jobs`, `Data movement`, `Observability & testing`
  - AI: `RAG & retrieval`, `Agent memory`, `Agent frameworks`, `Inference & serving`
- `documentation` (string or null) — official docs/landing URL, or `null` if none exists.
- `docsNote` (string) — reviewer-only note explaining a `null` `documentation`; not rendered. Use only with `documentation: null`, and include a `(checked YYYY-MM-DD)` date. Do not present an unverified URL as documentation.
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
- [ ] All required fields present: `name`, `description`, `type`, `license`, `repository`, `isFirstParty` — plus a 9-character `features` string for clients.
- [ ] Tested compatible with Valkey 7.2 or above.
- [ ] OSI-approved open-source license.
- [ ] Repository is publicly accessible, active within the last 6 months, and has a README with basic usage.
- [ ] Description is factual and vendor-neutral.
- [ ] Commits are signed per the DCO using `--signoff`.

By submitting this pull request, I confirm that my contribution is made under the terms of the BSD-3-Clause License.
