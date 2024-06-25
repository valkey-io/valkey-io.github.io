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


ln -s $1 ./build-topics 

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

echo "Topic stub files created."

for fname in $(find $1 -maxdepth 1  -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.gif")
do
    base=${fname##*/}
    cp ${fname} ./content/topics/${base}
done
echo "Copied images to topics directory."
