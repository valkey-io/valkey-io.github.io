#!/bin/bash
# Generate command sidebar data
# This script pre-processes all command JSON files into a single sidebar data file
# to avoid the performance issue of loading hundreds of JSON files per page

set -e

# Directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Paths to command JSON directories (relative to repo root)
COMMAND_JSON_PATH="$REPO_ROOT/build-command-json"
BLOOM_JSON_PATH="$REPO_ROOT/build-bloom-command-json" 
JSON_JSON_PATH="$REPO_ROOT/build-json-command-json"
SEARCH_JSON_PATH="$REPO_ROOT/build-search-command-json"

# Output file
OUTPUT_FILE="$REPO_ROOT/_data/commands_sidebar.json"

# Create _data directory if it doesn't exist
mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "Generating command sidebar data..."

# Start JSON array
echo "[" > "$OUTPUT_FILE"

first_entry=true

# Function to process a JSON file and extract command data
process_command_json() {
    local json_file="$1"
    local slug="$2"
    
    if [[ -f "$json_file" ]]; then
        # Extract command data using jq
        local command_data=$(jq -r '
            to_entries | .[0] | 
            {
                command_name: .key,
                summary: (.value.summary // ""),
                group: (.value.group // ""),
                container: (.value.container // "")
            }
        ' "$json_file" 2>/dev/null)
        
        if [[ "$command_data" != "null" && "$command_data" != "" ]]; then
            local command_name=$(echo "$command_data" | jq -r '.command_name')
            local summary=$(echo "$command_data" | jq -r '.summary')
            local group=$(echo "$command_data" | jq -r '.group')
            local container=$(echo "$command_data" | jq -r '.container')
            
            # Build display name
            local display_name="$command_name"
            if [[ "$container" != "null" && "$container" != "" ]]; then
                display_name="$container $command_name"
            fi
            
            # Add comma if not first entry
            if [[ "$first_entry" != "true" ]]; then
                echo "," >> "$OUTPUT_FILE"
            fi
            first_entry=false
            
            # Write command entry as JSON
            cat >> "$OUTPUT_FILE" << EOF
    {
        "display": "$display_name",
        "permalink": "/commands/$slug/",
        "summary": "$summary",
        "group": "$group"
    }
EOF
        fi
        return 0
    fi
    return 1
}

# Process all command files
for md_file in "$REPO_ROOT/content/commands"/*.md; do
    if [[ -f "$md_file" ]]; then
        # Get slug from filename
        slug=$(basename "$md_file" .md)
        
        # Skip _index.md
        if [[ "$slug" == "_index" ]]; then
            continue
        fi
        
        # Try each JSON source in order
        process_command_json "$COMMAND_JSON_PATH/$slug.json" "$slug" || \
        process_command_json "$BLOOM_JSON_PATH/$slug.json" "$slug" || \
        process_command_json "$JSON_JSON_PATH/$slug.json" "$slug" || \
        process_command_json "$SEARCH_JSON_PATH/$slug.json" "$slug"
    fi
done

# Close JSON array
echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

echo "Command sidebar data generated in $OUTPUT_FILE"