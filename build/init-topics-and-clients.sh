#!/bin/bash
# See README for usage
# This file will create stub files for all the topics.

# first check to make sure there are arguments
if [ -z "$1" ]; then
    echo "You must supply a path to the topics as the first argument"
    exit 1
fi

if [ -z "$2" ]; then
    echo "You must supply a path to the clients directory as the second argument"
    exit 1
fi

# check for validity of these arguments as paths
if [ ! -d "$1" ]; then
    echo "The topics directory must exist and be a valid path"
    exit 1
fi

if [ ! -d "$2" ]; then
    echo "The clients directory must exist and be a valid path"
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
        if [ -f "./build/custom-frontmatter/topics/$topic.toml" ]; then
            echo "+++" >> "./content/topics/$topic.md"
            cat "./build/custom-frontmatter/topics/$topic.toml" >> "./content/topics/$topic.md"
            echo "+++" >> "./content/topics/$topic.md"
        else
            cat << EOF > "./content/topics/$topic.md"
+++
# This is a generated stub file.
# To edit the content see /topic/$topic.md in the 'valkey-doc' repo
aliases = ["/docs/topics/$topic/"]
+++
EOF
fi
fi
done

echo "Topic stub files created at content/topics."

for fname in $(find $1 -maxdepth 1  -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.gif")
do
    base=${fname##*/}
    cp ${fname} ./content/topics/${base}
done
echo "Copied images to topics directory."


# Create symlink to the directory with the documentation menu (nav.yml and
# modules-nav/), next to the topics directory.
nav_dir="$(dirname "$1")"
if [ -e build-nav ] && [ ! -L build-nav ]; then
    echo "build-nav exists and is not a symlink. Remove it before proceeding."
    exit 1
fi
if [ -f "$nav_dir/nav.yml" ]; then
    if [ ! -L build-nav ] || [ "$(readlink build-nav)" != "$nav_dir" ]; then
        ln -sfn "$nav_dir" ./build-nav || exit 1
    fi
    echo "Symlink to the documentation menu has been created at ./build-nav"
else
    # Remove a link to a previous docs checkout, so that its menu isn't used.
    rm -f ./build-nav
    echo "No nav.yml found next to the topics directory; the documentation menu will be empty."
fi

#create symlink to clients, expect if it already exists
if [ ! -L build-clients -o "$(readlink build-clients)" != "$2" ]; then
    ln -s $2 ./build-clients
fi
echo "Symlink to clients has been created at ./build-clients "

