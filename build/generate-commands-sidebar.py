#!/usr/bin/env python3
"""
Generate commands sidebar data for Valkey documentation site.

This script processes all command JSON files and creates a single
_data/commands_sidebar.json file containing all command entries.
This eliminates the need for the template to process hundreds of 
JSON files on every command page render.
"""

import json
import os
import sys
from pathlib import Path


def find_command_json_dirs():
    """Find all command JSON directories based on symlinks."""
    base_dir = Path(".")
    json_dirs = []
    
    for item in base_dir.iterdir():
        if item.name.startswith("build-") and item.name.endswith("-command-json") and item.is_symlink():
            json_dirs.append(item)
    
    return json_dirs


def process_command_json(json_path, slug):
    """Process a single command JSON file and extract relevant data."""
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Find the command object name (there should be only one key)
        command_obj_name = list(data.keys())[0]
        command_obj = data[command_obj_name]
        
        # Build command display name
        command_display = command_obj_name
        if command_obj.get("container"):
            command_display = f"{command_obj['container']} {command_display}"
        
        return {
            "display": command_display,
            "permalink": f"/commands/{slug}/",
            "summary": command_obj.get("summary", ""),
            "group": command_obj.get("group", "")
        }
        
    except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
        print(f"Warning: Could not process {json_path}: {e}", file=sys.stderr)
        return None


def generate_commands_sidebar():
    """Generate the commands sidebar data file."""
    commands_entries = []
    
    # Find all command JSON directories
    json_dirs = find_command_json_dirs()
    
    if not json_dirs:
        print("Warning: No command JSON directories found", file=sys.stderr)
        # Create empty data file
        output_data = {"commands": []}
    else:
        # Process all JSON files in all directories
        for json_dir in json_dirs:
            if not json_dir.exists():
                print(f"Warning: {json_dir} symlink target does not exist", file=sys.stderr)
                continue
                
            for json_file in json_dir.glob("*.json"):
                slug = json_file.stem
                command_data = process_command_json(json_file, slug)
                
                if command_data:
                    commands_entries.append([
                        command_data["display"],
                        command_data["permalink"],
                        command_data["summary"],
                        command_data["group"]
                    ])
        
        output_data = {"commands": commands_entries}
    
    # Write the output file
    output_path = Path("_data/commands_sidebar.json")
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Generated {output_path} with {len(commands_entries)} commands")


if __name__ == "__main__":
    generate_commands_sidebar()