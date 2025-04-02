# Release Notes Documentation

## Overview

The release notes system consists of two main parts:

1. A data pipeline that fetches and processes release information from GitHub
2. Frontend components that display both current and previous releases

## Data Pipeline

### Source Data

- GitHub Releases API endpoint: `https://api.github.com/repos/valkey-io/valkey/releases`
- Fetches all releases and processes them into two categories:
  - Latest release (with detailed notes)
  - Previous releases (grouped by major version)

### Script: `src/scripts/fetchReleaseNotes.ts`

- **Purpose**: Automatically fetches and processes release information
- **Execution**: Runs as part of `pnpm dev` and `pnpm process-content`
- **Features**:
  - Sorts releases by version number
  - Handles RC (Release Candidate) versions
  - Parses markdown content into structured sections
  - Generates download links for source code
  - Groups previous releases by major version

### Data Structure

The script generates two main data structures in `src/data/releaseNotes.ts`:

```typescript
// Current release with detailed notes
interface ReleaseNote {
  version: string;
  releaseDate: string;
  sections: {
    title: string;
    items: string[];
  }[];
  sourceCodeUrl: string;
}

// Previous releases grouped by major version
interface ReleaseGroup {
  majorVersion: string;
  releases: {
    version: string;
    releaseDate: string;
    url: string;
  }[];
}
```

## Frontend Components

### 1. Latest Release Display (`src/components/install/WhatsNew.tsx`)

- Displays the current release version and date
- Shows categorized release notes in sections:
  - Performance/Efficiency Improvements
  - Cluster modifications
  - Module Improvements
  - Behavior Changes
  - Bug Fixes
  - Build and Packaging changes
  - Assets (download links)
- Features:
  - Clickable asset links
  - Consistent styling with the rest of the application
  - Responsive layout

### 2. Previous Releases (`src/components/install/PreviousReleases.tsx`)

- Displays previous releases in an accordion format
- Groups releases by major version (e.g., 8.X.X, 7.X.X)
- Features:
  - Collapsible sections by major version
  - Direct links to GitHub releases
  - Release dates for each version
  - Sorted in descending order

## Usage

### Development

The release notes are automatically updated when running:

```bash
pnpm dev
```

### Manual Update

To manually update release notes:

```bash
pnpm fetch-release-notes
```

### Build Process

Release notes are included in the build process through:

```bash
pnpm build
```

## Styling

The components use Chakra UI for consistent styling:

- Light background colors for readability
- Consistent typography
- Responsive design
- Interactive elements (buttons, links) follow the application's color scheme

## Future Considerations

1. **Caching**:

   - Consider implementing caching for GitHub API calls
   - Add cache invalidation strategy

2. **Error Handling**:

   - Add fallback content for API failures
   - Implement retry logic for failed requests

3. **Performance**:

   - Consider lazy loading for previous releases
   - Implement pagination for large release histories

4. **Features**:
   - Add search functionality for releases
   - Implement filtering by version type (stable/RC)
   - Add release comparison functionality
