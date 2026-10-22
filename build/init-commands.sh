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

# The documentation menu needs each command's full name, container and group.
# They're written to the stub files below (using jq), so that the templates
# don't have to load every command's JSON file on every page. Without jq, the
# templates read the JSON files instead, which makes the build slower.
if command -v jq >/dev/null; then
    have_jq=1
else
    have_jq=0
    echo "jq not found: the site will build correctly, but more slowly."
fi

for fname in $(find $1 -maxdepth 1  -iname "*.md")
do
    base=${fname##*/}
    command=${base%.*}
    command_upper=$(awk '{ print toupper($0) }' <<< $command)
    if [[ "$command" != "index" ]]; then
        json_file=""
        if [ -f "$2/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey' repo"
            json_file="$2/$command.json"
        elif [ -f "$3/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey-bloom' repo"
            json_file="$3/$command.json"
        elif [ -f "$4/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey-json' repo"
            json_file="$4/$command.json"
        elif [ -f "$5/$command.json" ]; then
            metadata_path="/commands/$command.json in the 'valkey-search' repo"
            json_file="$5/$command.json"
        fi
        # TOML lines with the command's name, container and group, for the menu.
        menu_data=""
        if [ "$have_jq" = 1 ] && [ -n "$json_file" ]; then
            menu_fields=$(jq -r 'to_entries[0]
                | ((.value.container // "") | ascii_upcase) as $c
                | "command_name = \((($c + " " + .key) | ltrimstr(" ") | ascii_upcase) | @json)",
                  "command_container = \($c | @json)",
                  "command_group = \((.value.group // "") | @json)"' "$json_file")
            menu_data=$(printf '[extra]\n%s' "$menu_fields")
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
$menu_data
+++
EOF
fi
done

echo "Command stub files created."

for datafile in groups.json resp2_replies.json resp3_replies.json modules.json; do
    ln -s "../${1}/../${datafile}" "./_data/${datafile}"

    echo "Created link to ${datafile}"
done
