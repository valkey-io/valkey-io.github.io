# FAQ Component Documentation

## Overview

The FAQ system is a comprehensive solution for displaying frequently asked questions in a searchable, categorized interface. It consists of multiple components working together to provide a smooth user experience.

## Components Structure

```
FAQ/
├── FAQ.tsx (Main container)
├── components/
│   ├── FaqSearch.tsx
│   ├── FaqSidebar.tsx
│   └── FaqContent.tsx
└── data/
    └── faq.ts
```

## Data Structure

### Category Interface

```typescript
interface FaqCategory {
  id: string; // Unique identifier for the category
  name: string; // Display name of the category
  slug: string; // URL-friendly version of the name
}
```

### FAQ Interface

```typescript
interface Faq {
  id: string; // Unique identifier for the FAQ
  question: string; // The question text
  answer: string; // The answer text
  categoryId: string; // Reference to the parent category
}
```

### Example Data Format

```typescript
// Categories
const faqCategories = [
  {
    id: 'cat_1',
    name: 'Getting Started',
    slug: 'getting-started',
  },
  // ... more categories
];

// FAQs
const faqs = [
  {
    id: 'faq_1',
    question: 'What is Valkey?',
    answer: 'Valkey is an open-source key management solution...',
    categoryId: 'cat_1',
  },
  // ... more FAQs
];
```

## Component Documentation

### 1. FAQ (Main Container)

The main container component that orchestrates the entire FAQ system.

```typescript
import { FaqContent, FaqSearch, FaqSidebar } from '../components/faq';

// Usage
<FAQ />
```

**Features:**

- Manages global search state
- Handles layout and responsive design
- Coordinates communication between child components

### 2. FaqSearch

Search component for filtering FAQ items.

```typescript
interface FaqSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Usage
<FaqSearch
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
/>
```

**Features:**

- Real-time search functionality
- Form submission handling
- Styled search input with button

### 3. FaqSidebar

Navigation component displaying category list.

```typescript
interface FaqSidebarProps {
  setSearchQuery: (query: string) => void;
}

// Usage
<FaqSidebar setSearchQuery={setSearchQuery} />
```

**Features:**

- Category navigation
- Smooth scroll to selected category
- Clears search when navigating categories
- Styled category buttons

### 4. FaqContent

Main content display component.

```typescript
interface FaqContentProps {
  searchQuery: string;
}

// Usage
<FaqContent searchQuery={searchQuery} />
```

**Features:**

- Displays FAQs grouped by categories
- Filters content based on search query
- Expandable/collapsible FAQ items
- Empty state handling for no search results

## Styling

The FAQ system uses Chakra UI for styling with a consistent color scheme:

- Primary colors:

  - Background: `#E1EAFF` (light blue)
  - Active state: `#fff` (white)
  - Category background: `rgba(104, 147, 255, 0.1)`
  - Text: `secondary.purple.500`

- Interactive elements:
  - Hover states on category buttons
  - Smooth transitions for accordion items
  - Focus states removed for clean UI

## Adding New FAQs

To add new FAQs, extend the data arrays in `data/faq.ts`:

1. Add a new category (if needed):

```typescript
faqCategories.push({
  id: 'cat_new',
  name: 'New Category',
  slug: 'new-category',
});
```

2. Add new FAQ items:

```typescript
faqs.push({
  id: 'faq_new',
  question: 'Your new question?',
  answer: 'Your detailed answer...',
  categoryId: 'cat_new', // Reference to the category
});
```

## Best Practices

1. **IDs and Slugs:**

   - Use consistent ID formatting (e.g., `cat_1`, `faq_1`)
   - Create URL-friendly slugs using lowercase and hyphens

2. **Content:**

   - Keep questions concise and clear
   - Provide detailed, helpful answers
   - Group related questions in the same category

3. **Categories:**

   - Limit to a reasonable number (5-10 recommended)
   - Use clear, descriptive category names
   - Maintain logical grouping of questions

4. **Search Optimization:**
   - Include relevant keywords in questions and answers
   - Use common variations of terms to improve searchability

## Performance Considerations

- Search is performed client-side for immediate results
- Category navigation uses smooth scroll for better UX
- Accordion items are rendered only when needed
- Search filtering is case-insensitive for better matches
