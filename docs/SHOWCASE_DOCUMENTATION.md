# ShowCase Component Documentation

## Overview

The ShowCase component is a feature-rich display system for community content, tutorials, news, and case studies. It provides a grid-based layout of cards containing various types of content with consistent styling and responsive design.

## Component Structure

### ShowCase Component

**Location**: `src/components/community/ShowCase.tsx`

The ShowCase component is a React functional component that displays a grid of content cards. Each card contains:

- Featured image
- Title
- Excerpt
- HTML-formatted content
- "Read More" button

```typescript
interface ShowCaseProps {
  latestShowCase: ShowCaseType[];
}
```

### Data Structure

**Location**: `src/data/showCase.ts`

```typescript
interface ShowCase {
  id: string; // Unique identifier for the showcase item
  slug: string; // URL-friendly string for routing
  title: string; // Title of the showcase item
  excerpt: string; // Short description/preview
  content: string; // HTML-formatted main content
  imageUrl: string; // URL for the featured image
  date: string; // Publication date
  category: string; // Content category (tutorials, news, case-studies)
}
```

## Content Categories

The ShowCase system supports three main content categories:

1. `tutorials` - Educational content and how-to guides
2. `news` - Company updates and announcements
3. `case-studies` - Real-world implementation examples

## HTML Content Formatting

The `content` field supports the following HTML tags with specific styling:

### Supported HTML Tags

- `<h2>` - Main headings
- `<h3>` - Sub-headings
- `<p>` - Paragraphs
- `<ul>` - Unordered lists
- `<li>` - List items
- `<b>` - Bold text

### Styling Specifications

```css
h2 {
  fontsize: 1.5rem;
  fontweight: bold;
  color: secondary.purple.500;
}

h3 {
  fontsize: 1.2rem;
  fontweight: bold;
  color: secondary.purple.500;
}

p {
  marginbottom: 3;
}

ul {
  paddingleft: 4;
  marginbottom: 3;
}

li {
  marginbottom: 1;
}

b {
  fontweight: bold;
  color: secondary.purple.500;
}
```

## Usage Example

```typescript
import { ShowCase } from '../components/community/ShowCase';
import { mockShowCases } from '../data/showCase';

const CommunityPage = () => {
  return (
    <ShowCase latestShowCase={mockShowCases} />
  );
};
```

## Responsive Design

The component implements responsive design with the following breakpoints:

- Base (mobile): Single column layout
- MD and above: Four-column grid layout

## Best Practices

### Content Writing

1. Keep titles concise and descriptive
2. Write excerpts that are between 100-150 characters
3. Use HTML formatting in content for better readability
4. Include relevant images that are optimized for web

### Image Guidelines

- Recommended image dimensions: Maintain 16:9 aspect ratio
- Image optimization: Use compressed images for better performance
- Alt text: Always provide descriptive alt text for accessibility

### Performance Considerations

1. Images are lazy-loaded for better performance
2. Content is truncated appropriately to maintain consistent card heights
3. HTML content is rendered safely using React's dangerouslySetInnerHTML

## Routing

The component uses React Router for navigation:

- Each showcase item links to: `/community/show-case/${showCase.slug}`
- Ensure unique slugs for each showcase item

## Styling Theme

The component uses Chakra UI for styling with a consistent color scheme:

- Primary text color: `#072150`
- Accent color: `secondary.purple.500`
- Card background: `white`
- Card shadow: `boxShadow="md"`
- Border radius: `20px`

## Future Enhancements

Consider the following potential improvements:

1. Add pagination for large content sets
2. Implement content filtering by category
3. Add search functionality
4. Include social sharing buttons
5. Add content engagement metrics
