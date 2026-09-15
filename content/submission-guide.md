---
template: fullwidth.html
title: Submission Guide
aliases:
    - "/submission-guide.html"
---

# Valkey Libraries, Tools, and Integrations – Submission Guide

This document explains how to submit a client library, tool, integration, or framework for inclusion on the Valkey [Clients](https://valkey.io/clients/) and [Integrations](https://valkey.io/integrations/) pages.

All submissions are reviewed to ensure compatibility with Valkey and adherence to community standards. Every item listed on the Clients and Integrations pages has been tested with Valkey to confirm compatibility.

Each entry is a single JSON file that lives under `_data/libraries/`, organized into one of two group directories (`clients/` or `integrations/`), and is registered by path in `_data/libraries/manifest.json`. The site is built with [Zola](https://www.getzola.org/) at merge time; the pre-merge CI build loads every file listed in the manifest and **fails the build on any malformed or invalid entry**, so problems are caught before your change can merge.

---

## What Can Be Submitted?

We welcome submissions in three categories. Each maps to a `type` value; clients live in their own directory, while tools and AI libraries are both stored under `integrations/` and shown together on the Integrations page:

### Client Libraries — `type: "clients"` → `_data/libraries/clients/`
Official and community-maintained clients that implement the Valkey protocol in various programming languages (Python, JavaScript, Java, Go, PHP, Ruby, Rust, C#, etc.). These appear on the **Clients** page.

### Tools & Frameworks — `type: "tools"` → `_data/libraries/integrations/`
CLI and GUI applications, deployment and operations tooling, proxies and gateways, frameworks and ORMs, queues and background-job systems, data-movement connectors, and observability or testing tools. These appear on the **Integrations** page.

### AI & Agent Libraries — `type: "ai"` → `_data/libraries/integrations/`
AI memory platforms, agent frameworks, vector stores, RAG and retrieval integrations, and inference/serving engines that leverage Valkey for AI workloads. These also appear on the **Integrations** page, alongside tools.

---

## Entry Fields

An entry is a flat JSON object. The fields below are the complete set the catalog uses — do not add fields that are not listed here, as they will be ignored by the templates and may fail review.

### Required Fields (all entries)

#### `name` (string)
The official name of the library, tool, or integration. Also used to derive the card's slug.

**Example:** `"Valkey GLIDE Python"`, `"valkey-search"`, `"CocoIndex"`

#### `description` (string)
A concise description (1–2 sentences) explaining what the entry does and its primary use case. This appears on the card.

**Guidelines:**
- Keep it under ~200 characters for optimal display.
- Focus on what makes it unique or valuable.
- Avoid marketing language; be factual and specific.

#### `type` (string)
Exactly one of `"clients"`, `"tools"`, or `"ai"`. Clients appear on the Clients page; tools and AI libraries appear together on the Integrations page. The value must match the group directory the file lives in: `clients` → `clients/`, and both `tools` and `ai` → `integrations/`.

#### `license` (string)
The SPDX identifier of the open-source license the software is distributed under.

**Example:** `"Apache-2.0"`, `"MIT"`, `"BSD-3-Clause"`, `"LGPL-3.0"`

**Note:** An open-source license is required. Proprietary or source-available licenses are considered only by exception, where the tool provides significant community value.

#### `repository` (string)
The URL of the source-code repository (GitHub, GitLab, Bitbucket, etc.).

**Example:** `"https://github.com/valkey-io/valkey-glide/tree/main/python"`

#### `isFirstParty` (boolean)
Whether the project is maintained by the Valkey project itself. Set to `true` for repositories under `github.com/valkey-io/`, and `false` for everything else. This drives the **Valkey Project** toggle on both the Clients and Integrations pages, and adds a "Valkey Project" badge to the card, so it is required on every entry.

### Required for Clients

#### `features` (string, clients only)
A **9-character bit-string** of `"0"`/`"1"` describing advanced-feature support. Each position maps, in order, to one feature key:

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

`"1"` means the feature is supported. For example `"111101000"` means replica, backoff, pubsub, scan, and az are supported and the rest are not. The human-readable labels and definitions for these keys live in `_data/libraries/metadata.json` (`featureDescriptions`) and are shared by every client; you do not repeat them per entry.

### Optional Fields

#### `language` (string)
The primary programming language. **Required in practice for clients** and for any library developers import into their code (ORM adapters, agent frameworks, SDK wrappers). Omit for standalone tools (CLI utilities, desktop apps, web UIs). Used for the Language filter on the Clients page.

**Example:** `"Python"`, `"Java"`, `"Go"`, `"TypeScript"`

**Multi-language support:** If your library ships separate packages per language, create **one entry per language**, each with its own `installCommand`, `documentation`, and `features`.

#### `tags` (array of strings, tools & AI)
One or more curated tags used for the Category filter on the Integrations page. Clients do not use tags. Use an existing tag where one fits; introduce a new one only when necessary. Tags currently in use:

- **Tools:** `CLI & GUI`, `Deploy & operate`, `Proxies & gateways`, `Frameworks & ORMs`, `Queues & background jobs`, `Data movement`, `Observability & testing`
- **AI:** `RAG & retrieval`, `Agent memory`, `Agent frameworks`, `Inference & serving`

#### `documentation` (string or null)
The official documentation or landing-page URL. Used for the card's title link and the "Documentation" footer link. Set to `null` when no dedicated docs site exists.

#### `docsNote` (string)
A short note explaining a `null` `documentation` value. **Reviewer and maintainer context only — it is not rendered on the card**, so it can be candid.

**Use it only alongside `documentation: null`.** If you have a documentation URL, put it in `documentation` and omit `docsNote`; a note next to a populated URL has nothing to explain.

**A useful note answers three things:** what you looked for, what exists instead, and when you checked. The date matters because docs sites appear and disappear — a note without one cannot be trusted a year later. Use the form `(checked YYYY-MM-DD)`.

**Examples from the catalog:**

```json
"docsNote": "No dedicated Valkey-branded docs site; only redis.github.io API docs from the ioredis lineage exist (checked 2026-09-03)."
"docsNote": "No dedicated docs site; only an in-repo QUICK_START.md exists (checked 2026-09-03)."
```

**Do not present an unverified URL as though it were documentation.** If you found a candidate and could not confirm it, say so explicitly in the note and still leave `documentation` as `null`. This is not hypothetical: one entry's note recorded an unconfirmed `<project>.io` reference, and that domain turned out to be a **parked for-sale page** with no documentation on it. Naming it as unverified in `docsNote` is what kept it out of the `documentation` field.

**Not a substitute for having docs.** A note saying documentation is absent does not satisfy the documentation expectation in the review checklist below; it records the gap honestly so a reviewer is not left guessing whether the field was researched or simply skipped.

#### `installCommand` (string)
The primary install command using the language's standard package manager. Rendered with a copy button.

**Example:** `"pip install valkey-glide"`, `"npm install @valkey/valkey-glide"`, `"go get github.com/valkey-io/valkey-go"`

#### `isGlide` (boolean)
Optional flag marking Valkey GLIDE clients. (First-party status is captured by the required `isFirstParty` field described above.)

---

## Example Entries

A client (`_data/libraries/clients/valkey-glide-python.json`):

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

An integration (`_data/libraries/integrations/valkey-cli.json`):

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

---

## Verification Checklist

Before submitting, verify that your submission meets these criteria:

- [ ] **Valid JSON:** The file parses (no trailing commas, matched brackets, quoted keys).
- [ ] **Correct location:** The file is under the group directory that matches its `type`.
- [ ] **Registered:** The relative path is listed in `_data/libraries/manifest.json`.
- [ ] **Required fields present:** `name`, `description`, `type`, `license`, `repository`, `isFirstParty` — plus a 9-character `features` string for clients.
- [ ] **Compatibility Tested:** The library/tool has been tested with Valkey 7.2 or above.
- [ ] **Open Source:** The project uses an OSI-approved open-source license.
- [ ] **Active Maintenance:** The repository shows recent activity within the last 6 months.
- [ ] **Documentation:** The repository includes a README with basic usage instructions.
- [ ] **Working Repository Link:** The repository URL is publicly accessible.
- [ ] **Factual Information:** All claims about features, compatibility, and performance are accurate.
- [ ] **Vendor Neutrality:** The description avoids vendor-specific marketing or competitive claims.

---

## How to Submit

1. **Fork the Repository:** Fork the [valkey-io.github.io repository](https://github.com/valkey-io/valkey-io.github.io) on GitHub.

2. **Create Your Entry File:** Add a new JSON file in the group directory that matches your `type`:
   - Client libraries → `_data/libraries/clients/`
   - Tools & frameworks → `_data/libraries/integrations/`
   - AI & agent libraries → `_data/libraries/integrations/`

   Name the file after your entry (lowercase, hyphenated), e.g. `_data/libraries/clients/valkey-glide-python.json`.

3. **Register It in the Manifest:** Add the file's path, relative to `_data/libraries/`, to the matching array in `_data/libraries/manifest.json`. The manifest has two arrays — `clients` and `integrations`:

   ```json
   {
     "clients": [
       "clients/valkey-glide-python.json",
       "..."
     ],
     "integrations": [
       "integrations/valkey-cli.json",
       "integrations/cocoindex.json"
     ]
   }
   ```

   Manifest order is render order. Every entry file must be listed exactly once in the array for its group; a file that is not in the manifest will not appear on the site.

4. **Follow the Field Definitions:** Use the fields described above and mirror an existing entry in the same directory as a template. Do not add fields that are not listed here.

5. **Build Locally (recommended):** Run the site build to confirm your entry loads and renders. The build fails on malformed JSON or a missing required field, naming the offending entry — the same check CI runs before merge.

6. **Submit a Pull Request:** Open a pull request that includes:
   - A clear PR title (e.g., "Add Valkey GLIDE Python client").
   - A brief description of what you're submitting.
   - Confirmation that you've tested compatibility with Valkey.
   - Links to documentation or release notes (if applicable).

7. **Review Process:** A maintainer reviews your submission for completeness, accuracy, and compatibility. You may be asked for clarification.

8. **Approval and Merge:** Once approved, your submission is merged and appears on the Clients or Integrations page in the next site update.

---

## Questions or Issues?

If you have questions about the submission process or need help preparing your entry, please:

- Open an issue in the [valkey-io.github.io repository](https://github.com/valkey-io/valkey-io.github.io/issues)
- Ask in the [Valkey Community Slack](https://valkey.io/community/)
- Email the maintainers at community@valkey.io

We welcome contributions from the community and look forward to showcasing your work!
