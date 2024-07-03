#!/bin/bash
# See README for usage
# This file will create stub files for all the topics.

# first check to make sure there are arguments
if [ -z "$1" ]; then
    echo "You must supply a path to the topics as the first argument" 
    exit 1
fi 

# check for validity of these agruments as paths
if [ ! -d "$1" ]; then
    echo "The topics directory must exist and be a valid path"
    exit 1
fi

# check for old style /docs/topics
if [ -e "content/docs/topics" ]; then
    echo "Documentation topic files have moved. Delete content/docs/topics before proceeding."
    exit 1
fi

# Create symlink to topics, except if it already exists and points to the same directory.
if [ ! -L build-topics -o "$(readlink build-topics)" != "$1" ]; then
    ln -s $1 ./build-topics
fi

for fname in $(find $1 -maxdepth 1  -iname "*.md")
do
    base=${fname##*/}
    topic=${base%.*}
    if [[ "$topic" != "index" ]]; then
        cat << EOF > "./content/topics/$topic.md"
+++
# This is a generated stub file.
# To edit the content see /topic/$topic.md in the 'valkey-doc' repo
aliases = ["/docs/topics/$topic/"]
+++
EOF
fi
done

echo "Topic stub files created at content/topics."

for fname in $(find $1 -maxdepth 1  -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.gif")
do
    base=${fname##*/}
    cp ${fname} ./content/topics/${base}
done
echo "Copied images to topics directory."
