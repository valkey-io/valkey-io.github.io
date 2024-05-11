#!/bin/bash
# See README for usage
# This file will create stub files for all the docs/topics.

ln -s $1 ./build-topics 

for fname in $(find $1 -maxdepth 1  -iname "*.md")
do
    base=${fname##*/}
    topic=${base%.*}
    if [[ "$topic" != "index" ]]; then 
        cat << EOF > "./content/docs/topics/$topic.md"
+++
+++
EOF
fi
done