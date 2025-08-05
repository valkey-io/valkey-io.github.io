#!/usr/bin/env python3
"""
Generate commands sidebar data to improve build performance.

This script pre-generates the commands list data that was previously computed
on every command page render, causing quadratic scaling and build time explosion.
"""

import json
import os
import glob
from pathlib import Path

def find_command_json_files():
    """Find all command JSON files from different modules."""
    base_dir = Path('.')
    json_paths = [
        'build-command-json',
        'build-bloom-command-json', 
        'build-json-command-json',
        'build-search-command-json'
    ]
    
    all_files = []
    for json_path in json_paths:
        pattern = f"{json_path}/*.json"
        files = glob.glob(pattern)
        for file in files:
            all_files.append(file)
    
    return all_files

def extract_command_data(json_file):
    """Extract command data from a JSON file."""
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        # Get the command object name (first key in the JSON)
        if not data:
            return None
            
        command_obj_name = list(data.keys())[0]
        command_data_obj = data[command_obj_name]
        
        # Build command display name
        command_display = command_obj_name
        if command_data_obj.get('container'):
            command_display = f"{command_data_obj['container']} {command_display}"
        
        # Get command slug from filename
        slug = Path(json_file).stem
        
        return {
            'display': command_display,
            'permalink': f'/commands/{slug}/',
            'summary': command_data_obj.get('summary', ''),
            'group': command_data_obj.get('group', '')
        }
    except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
        print(f"Error processing {json_file}: {e}")
        return None

def generate_commands_sidebar_data():
    """Generate the commands sidebar data and save to _data/commands_sidebar.json."""
    print("Generating commands sidebar data...")
    
    # Find all command JSON files
    json_files = find_command_json_files()
    print(f"Found {len(json_files)} command JSON files")
    
    # Extract command data
    commands_entries = []
    for json_file in json_files:
        command_data = extract_command_data(json_file)
        if command_data:
            commands_entries.append(command_data)
    
    # Sort alphabetically by display name
    commands_entries.sort(key=lambda x: x['display'])
    
    # Ensure _data directory exists
    os.makedirs('_data', exist_ok=True)
    
    # Save to JSON file
    output_file = '_data/commands_sidebar.json'
    with open(output_file, 'w') as f:
        json.dump(commands_entries, f, indent=2)
    
    print(f"Generated {len(commands_entries)} command entries in {output_file}")
    return commands_entries

if __name__ == '__main__':
    generate_commands_sidebar_data()