# Valkey.io website

This repo contains the source for the valkey.io website (build scripts, template, blog posts, stylesheets, etc.).
The build integrates content from [`valkey-io/valkey-doc`](https://github.com/valkey-io/valkey-doc) and the commands definitions from [`valkey-io/valkey`](https://github.com/valkey-io/valkey), [`valkey-io/valkey-bloom`](https://github.com/valkey-io/valkey-bloom), and [`valkey-io/valkey-json`](https://github.com/valkey-io/valkey-json) (see [Build Locally](#build-locally) below for more details)

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](CONTRIBUTING.md) page to learn more about how to contribute to the website.

## Security

If you discover potential security issues, see the reporting instructions on our [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) page for more information.

## Build Locally

This site is built with [Zola](https://www.getzola.org/) 0.23.

Follow these steps to build the site locally:

1. [Install Zola](https://www.getzola.org/documentation/getting-started/installation/).
2. Switch to the directory with your fork of this repo.
3. Run `zola serve`

Open your browser to `http://127.0.0.1:1111/`

Zola will automatically rebuild on changes to the template or any content stored in this repo.
Changes to external content (command reference, documentation topics) require a restart of the Zola server process (`ctrl-c` then `zola serve` again, a browser refresh may also be needed).

### Checking catalog entries

The clients and integrations entries in `_data/libraries/` are checked by `build/validate-libraries.py`, against the rules in `_data/libraries/schema.json` and the SPDX license list.
CI runs it on pull requests that change the catalog and before every deploy.
To run it locally with [uv](https://docs.astral.sh/uv/), which installs the dependencies pinned in the script's `# /// script` header:

```shell
./build/validate-libraries.py
```

Without uv, install the dependencies listed in that header yourself, then run `python3 build/validate-libraries.py` with the Python version the header requires.

The script downloads the SPDX license list, so it needs network access.

## Building additional content

**By default, the site will build without documentation topics or the command reference.**
The content for documentation topics is stored within the `valkey-io/valkey-doc` repo.
The content for the command reference page is in the `valkey-io/valkey` repo.
The clients and integrations pages (`/clients/`, `/integrations/`) are built from `_data/libraries/` in this repo, so they need no other repo.

If you want to build the site with this content, you'll need to have a local copy of `valkey-io/valkey-doc` and `valkey-io/valkey` _outside_ of this repo.
Then follow the instructions to [build the documentation topics](#building-the-documentation-topics) and/or [build the command reference](#building-the-command-reference).
The instructions show how to use scripts that create symbolic links to the `valkey-io/valkey-doc` and `valkey-io/valkey` repos as well as create a series of empty stub files that tell Zola to create pages.

### Building the documentation topics

Documentation 'topics' (i.e. `/topics/keyspace/`, `/topics/encryption/`, `/topics/transactions/`) source content from `valkey-io/valkey-doc`.

```mermaid
flowchart TD
    A[Webpage: /topics/keyspace/ ]
    A --> B[Template: valkey-io/valkey-website]
    B --> H[Repo: valkey-io/valkey-doc ] --> I[File: /topics/keyspace.md ] --> Y[Topic content]
```

Let's say that this repo and your local copy of `valkey-io/valkey-doc` reside in the same directory.
First, stop the `zola serve` process if you're running it.
From the root directory of this repo run:

```shell
# You should only need to run this once or when you add a new topic.
./build/init-topics.sh ../valkey-doc/topics
```

Then, restart Zola.
Point your browser at `http://127.0.0.1:1111/topics/` and you should see the fully populated list of topics.
All files created in this process are ignored by git.
Commit your changes to your local copy of `valkey-io/valkey-doc`.

### Building the command reference

The command reference (i.e. `/commands/set/`, `/commands/get/`, `/commands/lolwut/`) sources information from `valkey-io/valkey`, `valkey-io/valkey-bloom`, and `valkey-io/valkey-doc`.
`valkey-io/valkey`, `valkey-io/valkey-bloom`, `valkey-io/valkey-json` and `valkey-io/valkey-search` provides the command metadata (items like computational complexity, version history, arguments, etc)
whilst `valkey-io/valkey-doc` provides the command description and the command reply.

```mermaid
flowchart TD
    A[Webpage: valkey.io/commands/set]
    A --> B[Template: valkey-io/valkey-website]
    B --> F[Repo: valkey-io/valkey ] --> G[File: /src/commands/set.json ] --> X[Command Metadata]
    B --> H[Repo: valkey-io/valkey-doc ] --> I[File: /commands/set.md ] --> Y[Command Description]
    H --> J[Files: /resp2_replies.json,<br/>/resp3_replies.json] --> Z[Command Reply]
```

Let's say that this repo and your local copy of `valkey-io/valkey-doc`, `valkey-io/valkey-bloom`, `valkey-io/valkey-json`, `valkey-io/valkey-search`
and `valkey-io/valkey` reside in the same directories.

First, stop the `zola serve` process if you're running it.
From the root directory of this repo run:

```shell
# You should only need to run this once or when you add a new command,
# or when a command's group or container changes.
./build/init-commands.sh ../valkey-doc/commands ../valkey/src/commands \
    ../valkey-bloom/src/commands ../valkey-json/src/commands ../valkey-search/src/commands
```

The script uses [jq](https://jqlang.org/), if installed, to store each command's group and container for the documentation menu.
Without jq, the site still builds correctly, but more slowly.

Then, restart Zola.
Point your browser at `http://127.0.0.1:1111/commands/` and you should see the fully populated list of topics.
All files created in this process are ignored by git.
Commit your changes to your local copy of `valkey-io/valkey-doc` for description changes and `valkey-io/valkey` for command JSON changes (if you have any).

### Checking links

Pull requests and deploys check the built site for links to missing pages or `#anchors`, and for valkey-doc links that weren't converted to site URLs.
To run the checks locally (needs [lychee](https://lychee.cli.rs/) and jq), set up the topics and commands as above, then:

```shell
zola build
build/broken-links.sh public
build/unconverted-doc-links.sh public
```

## Link preview cards

A blog post with `og_card = true` gets a link preview card, its title over the Valkey background, as `/blog/<slug>/og.jpg`; [CONTRIBUTING-BLOG-POST.md](CONTRIBUTING-BLOG-POST.md#link-preview-cards) covers the front matter and the line rules.
Its `og:image` and `twitter:image` point there.

Zola can't draw text into an image, so it renders every card as HTML on one page, `/og-cards/` (`templates/og-cards.html`, out of the sitemap and search, and `noindex`), and the site's build screenshots them.
`build/og-cards.mjs` serves a built site on 127.0.0.1, has headless Chrome capture each 1200x630 card at twice the pixel density as a 2400x1260, quality 90 JPEG, deletes `/og-cards/`, and fails if any card post's `og.jpg` is missing, the wrong size, or 1 MB or more.
The platforms scale the larger image down cleanly, and JPEG keeps the particle background in full colour at about 300 KB, where a lossless PNG is 1.6 MB.
To run it yourself, with Node 20 or later and Chrome or Chromium (set `CHROME` to pick one):

```shell
zola build
node build/og-cards.mjs public
```

The card is `templates/macros/og-card.html` and `sass/css/og-cards.scss`, over `static/assets/media/og-card/default-bg.webp`.
The template sets the lines by adding up Open Sans's advance widths from `_data/og-card/open-sans-400.json`, against right edges measured from that background (`og_card.edge`), so a new background needs new edges.
`build/og-card-widths.py` regenerates the width table when the Open Sans font files change:

```shell
./build/og-card-widths.py
```

It runs with [uv](https://docs.astral.sh/uv/), or with `python3` once Pillow is installed.

## License

This project is licensed under the BSD-3-Clause License.
