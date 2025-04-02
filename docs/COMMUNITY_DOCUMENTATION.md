# Community Documentation

## Community Cards

The community section of Valkey.io uses a card-based interface to display various community resources and features. These cards are defined in `src/data/communityCards.ts`.

### Data Structure

The community cards are implemented using the following TypeScript interface:

```typescript
export interface CommunityCard {
  title: string; // The title of the community card
  description: string; // A brief description of the resource
  buttonText: string; // Text to display on the card's action button
  link: string; // The URL/route where the button will navigate to
}
```

### Available Community Cards

The following community cards are currently implemented:

1. **Discussion Forum**

   - Purpose: Main community discussion platform
   - Route: `/community/forum`
   - Description: A space for community members to share ideas and get help

2. **FAQ**

   - Purpose: Frequently Asked Questions
   - Route: `/community/faq`
   - Description: Central location for common questions and answers about Valkey

3. **Code of Conduct**
   - Purpose: Community Guidelines
   - Route: `/community/code-of-conduct`
   - Description: Documentation of community standards and expectations

### Usage

To use the community cards in your components:

```typescript
import { communityCards, CommunityCard } from '@/data/communityCards';

// Access all cards
const allCards = communityCards;

// Access a specific card
const forumCard = communityCards[0];
const faqCard = communityCards[1];
const conductCard = communityCards[2];
```

### Adding New Community Cards

To add a new community card:

1. Open `src/data/communityCards.ts`
2. Add a new object to the `communityCards` array following the `CommunityCard` interface:

```typescript
{
  title: 'Your New Card',
  description: 'Description of the new resource',
  buttonText: 'Action Button Text',
  link: '/community/your-route'
}
```

### Best Practices

1. Keep descriptions concise and clear
2. Use action-oriented button text
3. Ensure all links are valid routes in the application
4. Maintain consistent styling across cards
5. Update this documentation when adding new card types or modifying the interface

### Related Components

The community cards are typically rendered using dedicated components in the application. Refer to the component documentation for details on the visual implementation and styling of these cards.

## ShowCase Section

The showcase section displays a grid of featured projects and implementations using Valkey. These showcase items are defined in `src/data/showCase.ts`.

### Data Structure

The showcase items are implemented using the following TypeScript interface:

```typescript
export interface ShowCase {
  title: string; // The title of the showcase item
  date: string; // Publication date
  excerpt: string; // A brief description of the project
  slug: string; // URL-friendly identifier
  category: string; // Category of the showcase (tutorials, news, case-studies)
  imageUrl: string; // URL to the showcase item's featured image
}
```

### Component Features

The ShowCase component (`src/components/community/ShowCase.tsx`) includes:

1. **Grid Layout**

   - Responsive grid with 4 columns on desktop
   - Single column on mobile devices
   - Gap spacing of 8 units between items

2. **Card Design**

   - White background with shadow
   - Rounded corners (20px border radius)
   - Featured image with consistent height
   - Title and excerpt with controlled line height
   - "Read More" button with hover effects

3. **Content Display**
   - Image: Displayed at the top with 100px height and cover fit
   - Title: 16px font size with 1.4 line height
   - Excerpt: Limited to 2 lines with ellipsis
   - Action Button: Outline style with custom hover effects

### Usage

To use the showcase section in your components:

```typescript
import { mockShowCases, ShowCase } from '@/data/showCase';
import { ShowCase as ShowCaseComponent } from '@/components/community/ShowCase';

// Use in your component
<ShowCaseComponent latestShowCase={mockShowCases} />
```

### Best Practices

1. Use high-quality images that are relevant to the showcase content
2. Keep titles concise and descriptive
3. Write clear, engaging excerpts that summarize the key points
4. Ensure all slugs are unique and URL-friendly
5. Categorize content appropriately using the predefined categories
6. Maintain consistent image aspect ratios for visual harmony

### Related Components

The showcase section is typically used in conjunction with other community components like CommunityCards and ContributeGrid. It's designed to highlight real-world implementations and success stories within the Valkey ecosystem.
