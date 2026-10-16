#!/usr/bin/env bash
# Prints failures from broken-links.sh or unconverted-doc-links.sh.
#
#   build/compare-link-failures.sh <before> <after>
#       Fails if a link in <after> isn't in <before>. If <before> doesn't exist (the base
#       didn't build), lists everything as below.
#   build/compare-link-failures.sh - <failures>
#       Fails if there are any failures.
#
# Compares links, not pages, so a new page that inherits a dead footer link doesn't fail.
set -euo pipefail
before=${1:?usage: compare-link-failures.sh <before|-> <after>} after=${2:?}

if [ "$before" != - ] && [ ! -e "$before" ]; then
  echo "The base commit didn't build, so every broken link is listed."
  before=-
fi

if [ "$before" = - ]; then
  if [ ! -s "$after" ]; then
    echo "No broken links."
    exit 0
  fi
  echo "Broken links ($(wc -l < "$after" | tr -d ' ')):"
  cut -f2 "$after" | sed 's/^/::error::/'
  exit 1
fi

new_links=$(comm -13 <(cut -f1 "$before" | sort -u) <(cut -f1 "$after" | sort -u))

# Each failure is "link<TAB>message". Group the messages by whether their link is new.
new=() already=()
while IFS=$'\t' read -r link message; do
  if grep -qxF -- "$link" <<< "$new_links"; then
    new+=("$message")
  else
    already+=("$message")
  fi
done < "$after"

if [ ${#new[@]} -gt 0 ]; then
  echo "Broken by this change (${#new[@]}):"
  printf '::error::%s\n' "${new[@]}"
else
  echo "This change doesn't break any links."
fi
if [ ${#already[@]} -gt 0 ]; then
  echo "Already broken before this change (${#already[@]}):"
  printf '  %s\n' "${already[@]}"
fi
if [ ${#new[@]} -gt 0 ]; then
  exit 1
fi
