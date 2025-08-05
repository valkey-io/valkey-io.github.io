# Command Sidebar Optimization

## Problem
The original command page template had a performance issue where each command page would regenerate the complete sidebar by:
1. Loading all command section pages (potentially 400+)
2. For each page, attempting to load 4 different JSON files
3. Processing all command data to build sidebar entries

This resulted in O(n²) scaling where n = number of commands, leading to build times of 15+ seconds.

## Solution
Implemented a two-tier optimization approach:

### 1. Pre-generation (Optimal)
- `build/generate-commands-sidebar.py` processes all command JSON files once during build setup
- Outputs `_data/commands_sidebar.json` containing pre-computed sidebar data
- Template loads this single file instead of processing hundreds of JSON files per page
- Reduces complexity from O(n²) to O(1) per page render

### 2. Fallback (Graceful Degradation)  
- If pre-generated file doesn't exist, template falls back to original dynamic processing
- Ensures the site builds correctly even without the optimization script
- Maintains backward compatibility

## Integration
The optimization is integrated into `build/init-commands.sh` which runs the pre-generation script after creating command stub files.

## Performance Impact
- Expected build time reduction: 15+ seconds → <1 second for command processing
- Eliminates quadratic scaling issue
- Maintains identical sidebar functionality