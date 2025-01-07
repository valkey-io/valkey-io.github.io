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

# check for validity of these agruments as paths
if [ ! -d "$1" ]; then
    echo "The command doc directory must exist and be a valid path"
    exit 1
fi

if [ ! -d "$2" ]; then
    echo "The command JSON directory must exist and be a valid path"
    exit 1
fi

ln -s $1 ./build-command-docs
ln -s $2 ./build-command-json

for fname in $(find $1 -maxdepth 1  -iname "*.md")
do
    base=${fname##*/}
    command=${base%.*}
    command_upper=$(awk '{ print toupper($0) }' <<< $command)
    if [[ "$command" != "index" ]]; then 
        cat << EOF > "./content/commands/$command.md"
+++
# This is a generated stub file.
# To edit the command description see /commands/$command.md in the 'valkey-doc' repo
# The command metadata is generated from /src/$command.json in the 'valkey' repo
aliases = ["/commands/$command_upper/"]
+++
EOF
fi
done

echo "Command stub files created."

for datafile in groups.json resp2_replies.json resp3_replies.json; do
    ln -s "../${1}/../${datafile}" "./_data/${datafile}"

    echo "Created link to ${datafile}"
done
