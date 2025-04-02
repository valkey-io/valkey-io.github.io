# Documentation System Structure

## Overview

The documentation system is built using TypeScript and React, providing a modern and interactive way to browse and search through Valkey's documentation. The system consists of several key components and data structures that work together to deliver a seamless documentation experience.

## Core Components

### Documentation Page (`src/pages/Documentation.tsx`)

The main documentation page component that provides:

- Responsive layout with sidebar and main content area
- Search functionality
- Dynamic routing for different documentation topics

### Documentation Sidebar (`src/components/documentation/DocumentationSidebar.tsx`)

A navigation component that:

- Displays categorized documentation topics
- Implements real-time search filtering
- Shows topic descriptions
- Highlights currently selected topic

### Documentation Content (`src/components/documentation/DocumentationContent.tsx`)

The content display component that:

- Renders documentation HTML content
- Provides breadcrumb navigation
- Applies consistent styling to documentation elements
- Supports dynamic content loading based on selected topic

## Data Structure

### Topics (`src/data/topics.ts`)

The topics data structure consists of:

```typescript
interface CommandCategory {
  id: string;
  topicName: string;
  description: string;
  htmlContent: string;
}

interface TopicCategory {
  title: string;
  items: CommandCategory[];
}
```

Topics are organized into categories:

- CONFIGURATION
- CLIENT HANDLING
- DATA TYPES
- SCRIPTING
- HIGH AVAILABILITY
- ADMINISTRATION
- PERFORMANCE
- TROUBLESHOOTING

### Documentation Data (`src/data/documentation.ts`)

The main documentation data structure:

```typescript
interface DocumentationData {
  introduction: {
    description: string;
    links: Array<{ text: string; url: string }>;
    content?: string;
  };
}
```

## Content Generation Pipeline

The documentation content is automatically generated through a series of scripts that run as part of the development process.

### Scripts

The content generation pipeline consists of the following scripts:

```json
{
  "scripts": {
    "process-content": "pnpm process-authors && pnpm process-blog && pnpm generate-command-reference && pnpm generate-topics",
    "process-authors": "tsx scripts/process-authors.ts",
    "process-blog": "tsx scripts/process-blog-posts.ts",
    "generate-command-reference": "tsx scripts/generateCommandReference.ts",
    "generate-topics": "tsx scripts/generate-topics.ts"
  }
}
```

### Topics Generation (`scripts/generate-topics.ts`)

The topics generator:

1. Clones/updates the valkey-doc repository from GitHub
2. Processes markdown files from the topics directory
3. Converts markdown content to HTML using marked
4. Organizes topics into predefined categories
5. Generates the `topics.ts` file

Configuration:

```typescript
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
});
```

### Development Workflow

When running the development server:

1. Run `pnpm dev` which:
   - Executes the content generation pipeline (`process-content`)
   - Processes authors
   - Processes blog posts
   - Generates command reference
   - Generates topics from valkey-doc
   - Starts the Vite development server

## Features

### Search Functionality

- Real-time filtering of documentation topics
- Searches through topic names and descriptions
- Preserves category structure in filtered results
- Empty state handling with user-friendly messages

### Styling

Documentation content uses consistent styling for:

- Headers (h2, h3, h4)
- Paragraphs
- Lists (ordered and unordered)
- Code blocks
- Links
- Images

### Responsive Design

The documentation system is fully responsive with:

- Mobile-first approach
- Flexible layout using Chakra UI
- Collapsible sidebar for mobile views
- Adaptive content width

## Recent Changes

1. Added automatic topic generation from valkey-doc repository
2. Integrated markdown to HTML conversion
3. Added content generation to development pipeline
4. Enhanced content styling with consistent typography
5. Improved mobile responsiveness
6. Added breadcrumb navigation
7. Enhanced code block styling

## Usage

### Adding New Topics

To add a new topic:

1. Create a new markdown file in the valkey-doc repository under the topics directory:

```markdown
---
title: 'Topic Name'
description: 'Topic description'
---

Content in markdown format
```

2. The topic will be automatically processed and added to the appropriate category based on its ID (filename without .md extension).

### Styling Content

Use standard markdown syntax in your topic files:

- `##` for main sections
- `###` for subsections
- ` ``` ` for code blocks
- Regular paragraphs
- `*` or `-` for unordered lists
- `1.` for ordered lists
- `[text](url)` for links

### Search Implementation

The search functionality filters topics based on:

- Topic name matches
- Description matches
- Case-insensitive comparison
- Preserves category structure
