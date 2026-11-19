#!/usr/bin/env bash
# Runs a check on a site before and after a change. Fails only on problems the change causes.
# Problems that were already there before are listed but don't fail.
#
#   build/compare-problems.sh <before|-> <after> <check command...>
#
# <before> and <after> are built sites. With - for <before> there's nothing to compare with, so
# every problem fails. The same goes if <before> doesn't exist or the check couldn't check it,
# such as a site from before the check was added.
#
# A check is a command that takes a built site and lists its problems on stdout, one
# "key<TAB>message" line each and nothing else, where the key says which problems are the same
# one before and after. It exits 0 if there are no problems, 1 if there are, and anything else if
# it couldn't check.
#
# Exits 0 if the change causes no problems, 1 if it does, and 2 if the check couldn't check
# <after>.
set -euo pipefail
export LC_ALL=C
if [ $# -lt 3 ]; then echo "usage: $(basename "$0") <before|-> <after> <check command...>" >&2; exit 2; fi
before=$1 after=$2
shift 2
check=("$@")

results=$(mktemp -d)
trap 'rm -rf "$results"' EXIT

# Runs the check on site $1, writing its problems to $2. Fails if the check couldn't check, or if
# its exit code doesn't match what it listed (such as a crash that lists nothing).
run_check() {
  local status=0
  "${check[@]}" "$1" > "$2" || status=$?
  case $status in
    0) [ ! -s "$2" ] ;;
    1) [ -s "$2" ] ;;
    *) false ;;
  esac
}

before_problems=$results/before.txt after_problems=$results/after.txt

if ! run_check "$after" "$after_problems"; then
  echo "::error::${check[*]} couldn't check $after"
  exit 2
fi

compare=false
if [ "$before" != - ]; then
  if [ ! -d "$before" ]; then
    echo "There's no build from before this change, so every problem fails."
  elif ! run_check "$before" "$before_problems" 2> "$results/before-errors.txt"; then
    echo "The check couldn't check the build from before this change, so every problem fails. It said:"
    sed 's/^/  /' "$results/before-errors.txt"
  else
    compare=true
  fi
fi

if [ "$compare" = false ]; then
  if [ ! -s "$after_problems" ]; then
    echo "No problems."
    exit 0
  fi
  echo "Problems ($(wc -l < "$after_problems" | tr -d ' ')):"
  cut -f2 "$after_problems" | sed 's/^/::error::/'
  exit 1
fi

new_keys=$(comm -13 <(cut -f1 "$before_problems" | sort -u) <(cut -f1 "$after_problems" | sort -u))

# Group the messages by whether their key is new.
new=() already=()
while IFS=$'\t' read -r key message || [ -n "$key" ]; do
  if grep -qxF -- "$key" <<< "$new_keys"; then
    new+=("$message")
  else
    already+=("$message")
  fi
done < "$after_problems"

if [ ${#new[@]} -gt 0 ]; then
  echo "Caused by this change (${#new[@]}):"
  printf '::error::%s\n' "${new[@]}"
else
  echo "This change doesn't cause any problems."
fi
if [ ${#already[@]} -gt 0 ]; then
  echo "Already there before this change (${#already[@]}):"
  printf '  %s\n' "${already[@]}"
fi
if [ ${#new[@]} -gt 0 ]; then
  exit 1
fi
