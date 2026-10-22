#!/bin/bash
# See README for usage
# This file will create stub files for all the commands and create the correct symbolic links for the JSON files

# first check to make sure there are arguments
if [ -z "$1" ]; then
    echo "You must supply a path to the command docs as the first argument"
    exit 1
fi

if [ -z "$2" ]; then
    echo "You must supply a path to the command json as the second argument"
    exit 1
fi

# check for validity of these arguments as paths
if [ ! -d "$1" ]; then
    echo "The command doc directory must exist and be a valid path"
    exit 1
fi

if [ ! -d "$2" ]; then
    echo "The command JSON directory must exist and be a valid path"
    exit 1
fi

if [ ! -d "$3" ]; then
    echo "The bloom module command JSON directory must exist and be a valid path"
    exit 1
fi

if [ ! -d "$4" ]; then
    echo "The JSON module command JSON directory must exist and be a valid path"
    exit 1
fi

if [ ! -d "$5" ]; then
    echo "The Search module command JSON directory must exist and be a valid path"
    exit 1
fi

# Uppercase aliases (/commands/GET/) collide with the lowercase pages
# (/commands/get/) on case-insensitive filesystems (macOS default). Since
# Zola 0.23, `zola build` may then write the alias redirect over the real
# page, so skip the aliases there. Override with VALKEY_COMMAND_ALIASES=1
# (always generate) or VALKEY_COMMAND_ALIASES=0 (never generate).
if [ -n "$VALKEY_COMMAND_ALIASES" ]; then
    with_aliases=$VALKEY_COMMAND_ALIASES
else
    probe=$(mktemp ./.case-probe-XXXXXX)
    if [ -e "$(tr '[:lower:]' '[:upper:]' <<< "$probe")" ]; then
        with_aliases=0
        echo "Case-insensitive filesystem detected: skipping uppercase command aliases."
    else
        with_aliases=1
    fi
    rm -f "$probe"
fi

ln -s $1 ./build-command-docs
ln -s $2 ./build-command-json
ln -s $3 ./build-bloom-command-json
ln -s $4 ./build-json-command-json
ln -s $5 ./build-search-command-json

for fname in $(find $1 -maxdepth 1  -iname "*.md")
do
    base=${fname##*/}
    command=${base%.*}
    command_upper=$(awk '{ print toupper($0) }' <<< $command)
    if [[ "$command" != "index" ]]; then
        if [ -f "$2/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey' repo"
        elif [ -f "$3/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey-bloom' repo"
        elif [ -f "$4/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey-json' repo"
        elif [ -f "$5/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey-search' repo"
        fi
        if [ "$with_aliases" = 1 ]; then
            aliases_line="aliases = [\"/commands/$command_upper/\"]"
        else
            aliases_line="# Uppercase alias skipped, see build/init-commands.sh"
        fi
        cat << EOF > "./content/commands/$command.md"
+++
# This is a generated stub file.
# To edit the command description see /commands/$command.md in the 'valkey-doc' repo
# The command metadata is generated from $metadata_path
$aliases_line
+++
EOF
fi
done

echo "Command stub files created."

for datafile in groups.json resp2_replies.json resp3_replies.json modules.json; do
    ln -s "../${1}/../${datafile}" "./_data/${datafile}"

    echo "Created link to ${datafile}"
done
