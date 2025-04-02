# Command Reference Documentation

## Overview

The command reference documentation is automatically generated from the Valkey documentation repository. This ensures that our documentation stays in sync with the official Valkey documentation.

## Data Sources

The command reference data is sourced from the following files in the [valkey-io/valkey-doc](https://github.com/valkey-io/valkey-doc) repository:

- `groups.json`: Contains command categories and their descriptions
- `commands.json`: Contains command metadata and specifications
- `commands/*.md`: Individual markdown files for each command's detailed documentation

## Data Pipeline

The command reference data is generated using the following pipeline:

1. **Data Fetching**

   - Fetches `groups.json` and `commands.json` from the Valkey documentation repository
   - Retrieves individual markdown files for each command

2. **Data Processing**

   - Transforms command categories from the groups data
   - Processes each command:
     - Converts command names to proper filenames
     - Handles special cases (prefixes, suffixes)
     - Converts markdown content to HTML
     - Generates unique IDs for each command

3. **Data Generation**
   - Creates a TypeScript file (`src/data/commandReference.ts`) containing:
     - Command categories
     - Command references with descriptions and HTML content

## Usage

The command reference data is automatically generated as part of the content processing pipeline. To update the command reference data:

```bash
# Update all content including command reference
pnpm process-content

# Update only command reference
pnpm generate-command-reference
```

## Data Structure

### CommandCategory Interface

The `CommandCategory` interface defines the structure for command categories:

```typescript
interface CommandCategory {
  id: string; // Unique identifier for the category
  categoryName: string; // Display name of the category
  description: string; // Description of what commands in this category do
}
```

### CommandReference Interface

The `CommandReference` interface defines the structure for individual commands:

```typescript
interface CommandReference {
  unid: string; // Unique identifier for the command
  command: string; // The command name
  description: string; // Short description of what the command does
  htmlContent: string; // Detailed HTML documentation of the command
  categories: string[]; // Array of category IDs this command belongs to
}
```

## Data Organization

### Command Categories

Commands are organized into categories that represent different functional areas. Each category has:

- A unique identifier
- A display name
- A description of what types of commands it contains

Example categories include:

- admin
- bitmap
- blocking
- connection
- dangerous
- geo
- hash
- hyperloglog
- etc.

### Command References

Each command reference contains:

1. A unique identifier (unid)
2. The command name
3. A brief description
4. Detailed HTML documentation including:
   - Usage syntax
   - Command complexity
   - Version information
   - Examples
   - Response format
   - History of changes
5. Associated categories

## HTML Content Structure

The `htmlContent` field uses a standardized structure:

```html
<dl>
  <dt>Usage:</dt>
  <dd>
    <code>COMMAND [arguments]</code>
  </dd>
</dl>

<dl>
  <dt>Complexity:</dt>
  <dd>O(N)</dd>
</dl>

<dl>
  <dt>Since:</dt>
  <dd>version</dd>
</dl>

<h2>Examples</h2>
<pre><code>example code</code></pre>

<h3>RESP2/RESP3 Reply</h3>
<p>Response information</p>

<h3>History</h3>
<table>
  <thead>
    <tr>
      <th>Version</th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>version</td>
      <td>change description</td>
    </tr>
  </tbody>
</table>
```

## Usage in Components

The command reference data is used in several React components:

1. `CommandReference.tsx` - Main component that orchestrates the display
2. `CommandReferenceContent.tsx` - Displays detailed command information
3. `CommandReferenceSidebar.tsx` - Shows the list of commands
4. `CommandReferenceHeader.tsx` - Displays the header
5. `CommandReferenceSearch.tsx` - Handles command searching

## Search and Filtering

Commands can be:

1. Filtered by category
2. Searched by command name
3. Grouped by their categories

The search is case-insensitive and matches against command names.

## Styling

The HTML content is styled using Chakra UI's style props and custom CSS. Key styling elements include:

- Code blocks use monospace fonts and specific background colors
- Tables are fully styled with borders and proper spacing
- Headers have consistent sizing and spacing
- Definition lists (dl, dt, dd) have specific margin and padding rules

## Example Usage

```typescript
// Accessing command categories
const categories = commandCategories;

// Finding commands in a specific category
const bitmapCommands = commandReferences.filter(cmd => cmd.categories.includes('bitmap'));

// Getting a specific command
const bitCountCommand = commandReferences.find(cmd => cmd.command === 'BITCOUNT');
```

## Special Cases

The command reference generator handles several special cases:

1. **Command Prefixes**

   - Commands starting with "CLUSTER" use "cluster-" prefix
   - Commands starting with "COMMAND" use "command-" prefix
   - Commands starting with "CONFIG" use "config-" prefix
   - Commands starting with "ACL" use "acl-" prefix

2. **Command Suffixes**

   - Commands ending with "\_RO" use "\_ro" suffix (e.g., "evalsha_ro.md")

3. **Filename Generation**
   - Spaces are converted to hyphens
   - Special characters are removed
   - Duplicate prefixes are prevented

## Maintenance

The command reference data is maintained through the following process:

1. Changes to the Valkey documentation repository are automatically reflected when running the content processing pipeline
2. The generated TypeScript file is version controlled but should not be edited manually
3. Any issues with command processing are logged during generation

## Troubleshooting

If you encounter issues with the command reference generation:

1. Check the console output for any warnings or errors
2. Verify that the command names in `commands.json` match the markdown filenames
3. Ensure all required dependencies are installed
4. Check the network connection to the Valkey documentation repository
