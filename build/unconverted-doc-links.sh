#!/usr/bin/env bash
# Lists links on topic and command pages that weren't converted to site URLs, one "key<TAB>message"
# line each. The browser resolves these against the page URL, so they can open the wrong page.
# For example, ../clients/ on /topics/installation/ opens /topics/clients/.
# Keyed by page too, since the same link opens a different page under topics and commands.
#
#   build/unconverted-doc-links.sh public
#
# Exits 0 if there are no problems, 1 if there are, and 2 if it couldn't check.
set -euo pipefail
if [ $# -ne 1 ]; then echo "usage: $(basename "$0") <built site>" >&2; exit 2; fi
cd "$1" || exit 2

# hrefs on topic and command pages that still start with ../ or point at a .md file, as the source
# docs write them. [^":] skips links with a scheme, such as https://…/README.md.
unconverted='href="(\.\./[^"]*|[^":]*\.md(#[^"]*)?)"'

# grep prints one "topics/x/index.html:href=\"../y.md\"" per match. It exits 1 when nothing
# matches, which means the site is clean.
problems=$({ grep -roE "$unconverted" topics commands --include=index.html || [ $? -eq 1 ]; } |
  while IFS= read -r match; do
    page=/${match%%index.html:*}   # topics/x/index.html:… → /topics/x/
    link=${match#*:href=\"}        # …:href="../y.md" → ../y.md"
    link=${link%\"}                # → ../y.md
    printf '%s\t%s links to %s, a doc link that was not converted to a site URL\n' \
      "$page $link" "$page" "$link"
  done | sort -u) || exit 2

if [ -z "$problems" ]; then exit 0; fi
echo "$problems"
exit 1
