# Commands Sidebar Performance Optimization

## Problem

The original implementation processed command JSON files on every command page render, causing:
- Quadratic scaling: O(n²) where n = number of command pages
- 692,224 JSON file operations for 416 command pages (416 × 416 × 4 JSON files)
- Build times of 45-76 seconds

## Solution

### Pre-Generation Approach

1. **Generate sidebar data once**: `build/generate-commands-sidebar.py` processes all command JSON files and creates `_data/commands_sidebar.json`
2. **Load static data**: Templates load the single pre-generated JSON file instead of processing hundreds of files
3. **Fallback support**: If pre-generated data isn't available, templates fall back to the original approach

### Performance Benefits

- **Linear scaling**: O(1) sidebar data loading per page render
- **Single file load**: One JSON file load instead of 416×4 = 1,664 loads per page
- **Build integration**: Automatic generation during `init-commands.sh`

## Usage

### Automatic Generation (Recommended)

The sidebar data is automatically generated when running:
```bash
./build/init-commands.sh [command-docs-path] [command-json-path] [bloom-json-path] [json-json-path] [search-json-path]
```

### Manual Generation

```bash
cd /path/to/valkey-io.github.io
python3 build/generate-commands-sidebar.py
```

### Template Usage

The `command-page.html` template automatically:
1. Tries to load `_data/commands_sidebar.json` (fast path)
2. Falls back to processing individual JSON files if pre-generated data unavailable
3. Maintains the same sidebar functionality and appearance

## Performance Results

- **Expected improvement**: ~95% reduction in build time
- **Scaling**: Linear O(n) instead of quadratic O(n²)
- **Maintainability**: Zero changes to sidebar functionality or appearance

## Files Modified

- `templates/command-page.html`: Updated to use pre-generated data with fallback
- `build/generate-commands-sidebar.py`: New script to generate sidebar data
- `build/init-commands.sh`: Integrated sidebar generation into build process