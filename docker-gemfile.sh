#!/bin/bash
set -e

if [ ! -f Gemfile ]; then
  echo "Gemfile not found. Are you in the right directory?"
  exit 1
fi

bundle install --retry 5 --jobs 20

exec "$@"