#!/bin/bash
# this bash script generates stubs directories/index files based on the command JSONs

COMMANDS="./_data/commands/latest/*.json"
for f in $COMMANDS
do
    COMMAND=$(basename -- "$f")
    COMMAND_FNAME=${COMMAND%.*}
    DESCRIPTION_FNAME="./_includes/commands/latest/${COMMAND_FNAME}.md"
    echo $DESCRIPTION_FNAME
    mkdir ./commands/$COMMAND_FNAME
    if [ -f "$DESCRIPTION_FNAME" ]; then
        echo "Exists, ${DESCRIPTION_FNAME}"
        DESCRIPTION_FRONTMATTER="description: ${COMMAND_FNAME}.md"
    else 
        DESCRIPTION_FRONTMATTER=""
    fi

    cat << EOF > ./commands/$COMMAND_FNAME/index.html
---
layout: command
title: $COMMAND_FNAME
$DESCRIPTION_FRONTMATTER
---
EOF
done