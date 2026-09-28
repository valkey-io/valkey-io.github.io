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

### 2. Build with external content

From the `valkey-io.github.io` directory:

```bash
# Run the init script to create symlinks
./build/init-topics-and-clients.sh ../valkey-doc/topics \
  ../valkey-doc/clients

# Start Zola development server with extra watch paths for client/topic symlinks
zola serve --extra-watch-path build-clients --extra-watch-path build-topics
```

### 3. View the site

Open your browser to `http://127.0.0.1:1111/`

## What the init script does

The `init-topics-and-clients.sh` script:
1. Creates symlinks in the website directory:
   - `build-topics` → `../valkey-doc/topics`
   - `build-clients` → `../valkey-doc/clients`
2. Creates stub files for topics (allows Zola to generate pages)
3. Copies topic images to the content directory

## Viewing specific pages

- **Client Libraries**: http://127.0.0.1:1111/clients/
- **Documentation Topics**: http://127.0.0.1:1111/topics/
- **Commands**: http://127.0.0.1:1111/commands/ (requires additional setup - see main README.md)

## Making changes

### Editing page content

1. Edit the relevant file under `content/` for introductory text
2. Edit the matching template under `templates/` for layout changes
3. Zola will automatically reload

## Troubleshooting

### Zola fails to start

1. Check Zola is installed: `zola --version`
2. Make sure you're in the `valkey-io.github.io` directory
3. Check for syntax errors in config.toml

### Changes not appearing

1. Stop Zola (Ctrl+C)
2. Re-run the init script (symlinks may have been removed)
3. Restart Zola: `zola serve --extra-watch-path build-clients --extra-watch-path build-topics`
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

## Building for production

To build static files without running a server:

```bash
# Run init script first
./build/init-topics-and-clients.sh ../valkey-doc/topics \
  ../valkey-doc/clients

# Build static site
zola build

# Output will be in ./public/
```

## Cleaning up

To remove generated files and symlinks:

```bash
# Remove symlinks
rm -f build-topics build-clients

# Remove generated topic stub files
rm -f content/topics/*.md

# Remove Zola build output
rm -rf public/
```

## Additional Resources

- [Zola Documentation](https://www.getzola.org/documentation/getting-started/overview/)
- [Main README](README.md) - Full website build instructions
