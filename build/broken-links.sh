#!/usr/bin/env bash
# Lists links in a built site to missing pages or #anchors, one "key<TAB>message" line each.
# Keyed by the link alone, so a new page that inherits a link that was already dead (such as one
# in the footer) isn't a new problem.
#
#   build/broken-links.sh public
#
# Exits 0 if there are no problems, 1 if there are, and 2 if it couldn't check.
set -euo pipefail
if [ $# -ne 1 ]; then echo "usage: $(basename "$0") <built site>" >&2; exit 2; fi
site=$(cd "$1" && pwd -P) || exit 2
report=$(mktemp)
trap 'rm -f "$report"' EXIT

status=0
# --offline skips links written as https://valkey.io/..., so point them at the build.
lychee --offline --no-progress --format json --output "$report" --config "$(dirname "$0")/lychee.toml" \
  --root-dir "$site" --remap "^https://valkey\.io/([^?#]*)[^#]*(#.*)?$ file://$site/\$1\$2" \
  "$site" > /dev/null || status=$?
case $status in
  0 | 2) ;;  # 2 means lychee found broken links
  *) echo "lychee itself failed (exit code $status)" >&2; exit 2 ;;
esac

problems=$(jq -r --arg root "$site" '.error_map | to_entries[] | .key as $page | .value[]
  | (.url | ltrimstr("file://" + $root)) as $link
  | ($page | ltrimstr($root) | rtrimstr("index.html")) as $on
  | (if (.status.text | startswith("Cannot find fragment")) then "but that page has no #\($link | split("#") | last) anchor"
     elif (.status.text | startswith("File not found")) then "but no such page exists"
     else .status.text end) as $problem
  | [$link, "\($on) links to \($link), \($problem)"] | @tsv' "$report" \
  | sort -u) || exit 2

if [ -z "$problems" ]; then exit 0; fi
echo "$problems"
exit 1
