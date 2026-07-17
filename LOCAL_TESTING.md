# Local Testing for Valkey Website

This guide explains how to build and test the Valkey website locally, including all content from the `valkey-doc` repository.

## Prerequisites

1. **Zola** - Static site generator
   ```bash
   # macOS
   brew install zola
   
   # Or download from https://www.getzola.org/documentation/getting-started/installation/
   ```

2. **Local copies of repositories** - All repos should be in the same parent directory:
   ```
   ~/projects/
   ├── valkey-io.github.io/    (this repo)
   └── valkey-doc/              (documentation repo)
   ```

## Quick Start

### 1. Clone required repositories

```bash
cd ~/projects  # or your preferred directory

# Clone the website repo (if you haven't already)
git clone https://github.com/valkey-io/valkey-io.github.io.git

# Clone the documentation repo
git clone https://github.com/valkey-io/valkey-doc.git
```

### 2. Build with AI Libraries content

From the `valkey-io.github.io` directory:

```bash
# Run the init script to create symlinks
./build/init-topics-and-clients.sh ../valkey-doc/topics \
  ../valkey-doc/clients \
  ../valkey-doc/ai

# Start Zola development server
zola serve
```

### 3. View the site

Open your browser to `http://127.0.0.1:1111/`

Navigate to **Documentation → AI Libraries** to see the AI libraries page.

## What the init script does

The `init-topics-and-clients.sh` script:
1. Creates symlinks in the website directory:
   - `build-topics` → `../valkey-doc/topics`
   - `build-clients` → `../valkey-doc/clients`
   - `build-ai` → `../valkey-doc/ai`
2. Creates stub files for topics (allows Zola to generate pages)
3. Copies topic images to the content directory

## Viewing specific pages

- **AI Libraries**: http://127.0.0.1:1111/ai/
- **Client Libraries**: http://127.0.0.1:1111/clients/
- **Documentation Topics**: http://127.0.0.1:1111/topics/
- **Commands**: http://127.0.0.1:1111/commands/ (requires additional setup - see main README.md)

## Making changes

### Editing AI library metadata

1. Edit JSON files in `valkey-doc/ai/{language}/`
2. Zola will automatically reload
3. Refresh browser to see changes

### Adding new AI libraries

1. Add JSON file to `valkey-doc/ai/{language}/` directory
2. Update `content/ai/_index.md` to add the path to `recommended_ai_paths` array
3. Zola will automatically reload

### Editing page content

1. Edit `content/ai/_index.md` for introductory text
2. Edit `templates/ai-list.html` for layout changes
3. Zola will automatically reload

## Troubleshooting

### "AI Libraries page not found"

This error appears when Zola can't find the AI library JSON files. Check:

1. The `build-ai` symlink exists:
   ```bash
   ls -la build-ai
   # Should show: build-ai -> ../valkey-doc/ai
   ```

2. The symlink points to the correct location:
   ```bash
   ls -la ../valkey-doc/ai
   # Should list language directories: java/, javascript/, lua/, python/
   ```

3. Re-run the init script if needed:
   ```bash
   ./build/init-topics-and-clients.sh ../valkey-doc/topics \
     ../valkey-doc/clients \
     ../valkey-doc/ai
   ```

### Zola fails to start

1. Check Zola is installed: `zola --version`
2. Make sure you're in the `valkey-io.github.io` directory
3. Check for syntax errors in config.toml

### Changes not appearing

1. Stop Zola (Ctrl+C)
2. Re-run the init script (symlinks may have been removed)
3. Restart Zola: `zola serve`
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### JSON syntax errors

If a library page doesn't load, check JSON syntax:

```bash
# Validate JSON files
python3 -m json.tool ../valkey-doc/ai/python/cognee.json

# Check all JSON files
for file in ../valkey-doc/ai/*/*.json; do
  echo "Checking $file"
  python3 -m json.tool "$file" > /dev/null || echo "ERROR in $file"
done
```

## Building for production

To build static files without running a server:

```bash
# Run init script first
./build/init-topics-and-clients.sh ../valkey-doc/topics \
  ../valkey-doc/clients \
  ../valkey-doc/ai

# Build static site
zola build

# Output will be in ./public/
```

## Cleaning up

To remove generated files and symlinks:

```bash
# Remove symlinks
rm -f build-topics build-clients build-ai

# Remove generated topic stub files
rm -f content/topics/*.md

# Remove Zola build output
rm -rf public/
```

## Additional Resources

- [Zola Documentation](https://www.getzola.org/documentation/getting-started/overview/)
- [Main README](README.md) - Full website build instructions
- [AI Libraries README](https://github.com/valkey-io/valkey-doc/blob/main/ai/README.md) - Adding new AI libraries
