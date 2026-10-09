#!/usr/bin/env bash
# Lists links in a built site to missing pages or #anchors.
#
#   build/broken-links.sh public
set -euo pipefail
site=$(cd "${1:?usage: broken-links.sh <built site>}" && pwd -P)
report=$(mktemp)

status=0
# --offline skips links written as https://valkey.io/..., so point them at the build.
lychee --offline --no-progress --format json --output "$report" --config "$(dirname "$0")/lychee.toml" \
  --root-dir "$site" --remap "^https://valkey\.io/([^?#]*)[^#]*(#.*)?$ file://$site/\$1\$2" \
  "$site" > /dev/null || status=$?
case $status in
  0 | 2) ;;  # 2 means lychee found broken links
  *) echo "lychee itself failed (exit code $status)" >&2; exit 1 ;;
esac

jq -r --arg root "$site" '.error_map | to_entries[] | .key as $page | .value[]
  | (.url | ltrimstr("file://" + $root)) as $link
  | ($page | ltrimstr($root) | rtrimstr("index.html")) as $on
  | (if (.status.text | startswith("Cannot find fragment")) then "but that page has no #\($link | split("#") | last) anchor"
     elif (.status.text | startswith("File not found")) then "but no such page exists"
     else .status.text end) as $problem
  | [$link, "\($on) links to \($link), \($problem)"] | @tsv' "$report" \
  | sort -u
