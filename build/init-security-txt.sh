#!/bin/bash
# See README for usage
# This file will generate static/.well-known/security.txt (RFC 9116).
#
# The Expires field is derived from the build date rather than committed, so it
# always sits one year past the last site build and cannot silently go stale.

# first check to make sure there are arguments
if [ -z "$1" ]; then
    echo "You must supply a path to the site root as the first argument"
    exit 1
fi

# check for validity of this argument as a path
if [ ! -d "$1" ]; then
    echo "The site root must exist and be a valid path"
    exit 1
fi

SITE_ROOT="$1"
WELL_KNOWN="${SITE_ROOT}/static/.well-known"

# one year past this build, in the RFC 3339 form RFC 9116 requires
if date -u -d '+1 year' >/dev/null 2>&1; then
    EXPIRES=$(date -u -d '+1 year' +%Y-%m-%dT%H:%M:%SZ)   # GNU date
else
    EXPIRES=$(date -u -v+1y +%Y-%m-%dT%H:%M:%SZ)          # BSD date
fi

mkdir -p "$WELL_KNOWN"

cat > "${WELL_KNOWN}/security.txt" <<EOF
# Valkey security contact — see https://github.com/valkey-io/valkey/security/policy
# Generated at build time by build/init-security-txt.sh — do not edit by hand.
Contact: mailto:security@lists.valkey.io
Expires: ${EXPIRES}
Preferred-Languages: en
Canonical: https://valkey.io/.well-known/security.txt
Policy: https://github.com/valkey-io/valkey/security/policy
EOF

echo "Wrote ${WELL_KNOWN}/security.txt (Expires: ${EXPIRES})"
