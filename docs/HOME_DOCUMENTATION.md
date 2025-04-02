# Home Page Documentation

## Components Overview

The home page consists of several key components:

- Hero
- Documentation
- WhatsNew
- Contribute
- Participants

## Participants Component

The Participants section showcases organizations contributing to the Valkey project. This component is located at `src/components/home/Participants.tsx`.

### Data Source

- **File Location**: `src/data/participants.ts`
- **Data Structure**:

```typescript
interface Participant {
  name: string;
  desc: string;
  logo: string;
}
```

### Features

- Responsive carousel display using react-slick
- Auto-playing slides with 3 items visible on desktop
- Single item view on mobile (breakpoint: 768px)
- Custom styling for navigation dots
- Company logos with descriptions

### Styling

- Background gradient: `linear(to-b, #6983FF, #30176E)`
- White text on dark background
- Responsive container width
- Custom dot navigation styling
- Card-based layout for participant information

## What's New Component

The What's New section of the home page displays both release notes and the latest blog posts. This component is located at `src/components/home/WhatsNew.tsx`.

### Data Sources

#### Release Notes

- **File Location**: `src/data/releaseNotes.ts`
- **Data Structure**:

```typescript
interface ReleaseNote {
  version: string;
  releaseDate: string;
  sections: {
    title: string;
    items: string[];
  }[];
}
```

- **Usage**: The release notes are displayed in a structured format with sections for new features, improvements, bug fixes, and known issues.
- **Current Version**: 1.5.0 (as of January 20, 2025)

#### Blog Posts

- **Data Source**: `src/data/blogPosts.ts`
- **Display**: Shows the two most recent blog posts
- **Blog Post Structure**:

```typescript
interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
  category: string;
  imageUrl: string;
  isTrending?: boolean;
  author: Author;
}
```

### Component Features

1. **Release Notes Section**

   - Displays version number and release date
   - Organized into collapsible sections (What's New, Improvements, Bug Fixes, Known Issues)
   - Each section contains a list of items with consistent styling
   - "Release Notes" button for accessing full release history

2. **Latest Blog Posts Section**
   - Shows 2 most recent blog posts
   - Each post displays:
     - Featured image
     - Title
     - Excerpt
     - "Read More" link (routes to `/blog/${post.slug}`)

### Styling

- Uses Chakra UI components for consistent styling
- Responsive layout:
  - Base: Single column
  - MD and above: Release notes span 2 columns, blog posts 1 column
- Color scheme:
  - Background gradient: `linear(to-b, #6983FF, #30176E)`
  - Text colors: White for headers, Dark for content
  - Buttons: Outline style with hover effects

### Recent Changes

1. **Data Centralization**

   - Moved release notes data to separate file (`src/data/releaseNotes.ts`)
   - Using centralized blog post data from `blogPosts.ts`
   - Improved maintainability by separating data from presentation

2. **Component Updates**
   - Removed local interfaces in favor of imported types
   - Updated blog post rendering to use consistent data structure
   - Improved link handling for blog posts

### Routes and Endpoints

1. **Home Page**

   - Route: `/`
   - Component: Includes `WhatsNew` component

2. **Blog Related**
   - Individual Blog Posts: `/blog/:slug`
   - Blog listing: `/blog`

### Future Considerations

1. **Potential Improvements**

   - Add pagination for release notes history
   - Implement caching for blog posts and release notes
   - Add filtering capabilities for release notes
   - Consider adding release notes archive page

2. **Maintenance**
   - Update release notes in `releaseNotes.ts`
   - Keep blog posts current in `blogPosts.ts`
   - Regularly review and update documentation

## Contribute Component

The Contribute section displays various ways users can contribute to the Valkey project. This component uses data from `src/data/contributeWays.ts`.

### Data Structure

```typescript
interface ContributeWay {
  title: string;
  description: string;
  icon: IconType;
  buttons?: {
    label: string;
    href: string;
    icon?: IconType;
  }[];
}
```

### Available Contribution Ways

1. **Ask Questions**

   - GitHub Discussions
   - Slack Community

2. **Report Bugs**

   - GitHub Issues

3. **Connect on Social Media**

   - LinkedIn
   - Twitter

4. **Suggest Features**

   - GitHub Issues

5. **Security Concerns**

   - Security Policy

6. **Community Conduct**
   - Code of Conduct

### Component Features

- Icon-based cards for each contribution method
- Descriptive text explaining each way to contribute
- Action buttons linking to relevant platforms
- Responsive layout
- Integration with React Icons for visual elements

### Routes and Endpoints

- Security Policy: `/security-policy`
- Code of Conduct: `/community/code-of-conduct`
- GitHub Repository: `https://github.com/valkey-io`
- Slack Community: `https://valkey-oss-developer.slack.com/join/shared_invite/zt-2nxs51chx-EB9hu9Qdch3GMfRcztTSkQ#/shared-invite/email`
- Social Media:
  - LinkedIn: `https://linkedin.com/company/valkey`
  - Twitter: `https://twitter.com/valkeyxyz`
