# Static Pages Documentation

This document outlines the static pages implemented using ReactMarkdown in the Valkey.io application.

## Overview

The application includes several static pages that are rendered using ReactMarkdown, providing a consistent and maintainable way to display content. Each page follows a similar structure and uses shared markdown components for styling.

## Available Pages

### 1. Privacy Policy

- **Path**: `/privacy-policy`
- **Component**: `src/pages/PrivacyPolicy.tsx`
- **Content Source**: Markdown content loaded via `usePrivacyPolicy` hook
- **Features**:
  - Responsive layout with gradient header
  - Styled markdown components
  - Loading and error states
  - Consistent typography and spacing

### 2. Terms of Service

- **Path**: `/terms-of-service`
- **Component**: `src/pages/TermsOfService.tsx`
- **Content Source**: Markdown content loaded via `useTermsOfService` hook
- **Features**:
  - Matching design with other static pages
  - Styled markdown components
  - Loading and error handling
  - Responsive container layout

### 3. Code of Conduct

- **Path**: `/code-of-conduct`
- **Component**: `src/pages/CodeOfConduct.tsx`
- **Content Source**: Markdown content loaded via `useCodeOfConduct` hook
- **Features**:
  - Consistent styling with other static pages
  - Styled markdown components
  - Loading and error states
  - Responsive design

### 4. Connect

- **Path**: `/connect`
- **Component**: `src/pages/Connect.tsx`
- **Content Source**: Markdown content loaded via `useConnect` hook
- **Features**:
  - Matching design with other static pages
  - Styled markdown components
  - Loading and error handling
  - Responsive container layout

## Common Components

All static pages use the following shared markdown components for consistent styling:

- `StyledH1`: Main heading styling
- `StyledH2`: Subheading styling
- `StyledParagraph`: Body text styling
- `StyledList`: Unordered list styling
- `StyledListItem`: List item styling
- `StyledLink`: Link styling

## Page Structure

Each static page follows this common structure:

1. Header section with gradient background
2. Main content container
3. Markdown content rendered with styled components
4. Loading spinner during content fetch
5. Error alert if content loading fails

## Implementation Details

Each page is implemented as a React component that:

1. Uses a custom hook to fetch markdown content
2. Implements loading and error states
3. Uses ReactMarkdown with custom components for rendering
4. Follows the application's design system
5. Is fully responsive

## Usage

To add or modify content for these pages:

1. Update the corresponding markdown content in the content source
2. The changes will be automatically reflected in the UI
3. No code changes are required unless modifying the page structure or styling

## Styling

The pages use Chakra UI components and custom styled markdown components to ensure:

- Consistent typography
- Proper spacing
- Responsive design
- Accessibility compliance
- Brand consistency
