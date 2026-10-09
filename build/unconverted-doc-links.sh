#!/usr/bin/env bash
# Lists valkey-doc links that fix_links (templates/macros/) didn't convert to site URLs.
# The browser resolves these against the page URL, so they can open the wrong page.
# For example, ../clients/ on /topics/installation/ opens /topics/clients/.
#
#   build/unconverted-doc-links.sh public
set -euo pipefail
cd "${1:?usage: unconverted-doc-links.sh <built site>}"

# hrefs on topic and command pages that still start with ../ or point at a .md file, as
# valkey-doc writes them. [^":] skips links with a scheme, such as https://…/README.md.
unconverted='href="(\.\./[^"]*|[^":]*\.md(#[^"]*)?)"'

# grep prints one "topics/x/index.html:href=\"../y.md\"" per match. It exits 1 when nothing
# matches, which means the site is clean.
{ grep -roE "$unconverted" topics commands --include=index.html || [ $? -eq 1 ]; } |
  while IFS= read -r match; do
    page=/${match%%index.html:*}   # topics/x/index.html:… → /topics/x/
    link=${match#*:href=\"}        # …:href="../y.md" → ../y.md"
    link=${link%\"}                # → ../y.md
    printf '%s\t%s links to %s, a valkey-doc link that was not converted to a site URL\n' "$link" "$page" "$link"
  done | sort -u
