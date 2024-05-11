#!/bin/bash
# Usage: ln -s ../valkey/src/commands/ build-commands-json
# This file will create stub files for all the commands.
#for fname in $(find $1 -maxdepth 1  -iname "*.md")
#do
#    base=${fname##*/}
#    command=${base%.*}
#    cat << EOF > "$2/$command.md"
#+++
#+++
#EOF

#done

#!/bin/bash
# See README for usage
# This file will create stub files for all the commands and create the correct symbolic links for the JSON files

ln -s $1 ./build-command-docs
ln -s $2 ./build-command-json

for fname in $(find $1 -maxdepth 1  -iname "*.md")
do
    base=${fname##*/}
    command=${base%.*}
    if [[ "$command" != "index" ]]; then 
        cat << EOF > "./content/commands/$command.md"
+++
+++
EOF
fi
done