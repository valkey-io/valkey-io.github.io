# Blog Content Documentation

## Data Pipeline

The blog content is processed through an automated pipeline that runs on development startup:

1. **Author Processing** (`scripts/process-authors.ts`)

   - Processes author data from `public/content/authors/*.md`
   - Generates `src/data/authors.ts`

2. **Blog Post Processing** (`scripts/process-blog-posts.ts`)

   - Processes blog posts from `public/content/blog/*.md`
   - Handles frontmatter in both `+++` and `---` formats
   - Processes markdown content with custom image path handling
   - Generates `src/data/blogPosts.ts`

3. **Development Integration**
   - The pipeline runs automatically on `pnpm dev`
   - Ensures content is always up-to-date during development

## Data Structure

### Author Interface

```typescript
interface Author {
  name: string; // Author's full name
  username: string; // Author's username (without @)
  bio: string; // Author's biography
  imageUrl: string; // Author's profile image URL
  role: string; // Author's role/position
  githubUser?: string; // Optional: GitHub username for profile link
}
```

### Category Interface

```typescript
interface Category {
  value: string; // Category identifier
  label: string; // Display name
  description: string; // Category description
}
```

### Blog Post Interface

```typescript
interface BlogPost {
  title: string; // The title of the blog post
  date: string; // ISO date string
  excerpt: string; // A brief summary of the post
  content: string; // HTML-formatted content of the post
  slug: string; // URL-friendly identifier (without date prefix)
  category: string; // Post category (matches Category.value)
  imageUrl: string; // URL to the post's featured image
  trending?: boolean; // Optional: Mark post as trending
  authors: Author[]; // Array of authors
}
```

## Categories

The blog system has predefined categories stored in the `categories` array:

```typescript
export const categories: Category[] = [
  {
    value: 'tutorials',
    label: 'Tutorials',
    description: 'Step-by-step guides and technical walkthroughs',
  },
  {
    value: 'news',
    label: 'News',
    description: 'Latest updates and announcements from Valkey',
  },
  {
    value: 'case-studies',
    label: 'Case Studies',
    description: 'Real-world examples and implementation stories',
  },
];
```

## Blog Components

### BlogContent

The main component that displays the list of blog posts. Features:

- Filters posts based on:
  - Search query (title, excerpt, date)
  - Category
  - Date
- Displays posts in a card format with:
  - Title
  - Date
  - Excerpt
  - Read More link

### BlogSearch

Search and filter interface component that includes:

- Search input for articles
- Category dropdown filter
- Date picker filter

### BlogSidebar

Displays trending posts in a sidebar format. Features:

- Shows posts marked with `trending: true`
- Each trending post displays:
  - Featured image (50% width)
  - Title (max 2 lines)
  - Excerpt (max 2 lines)
  - Read More button

### BlogPost Page

Individual blog post page layout:

1. **Header Section**

   - Breadcrumb navigation (Blog > Post Title)
   - Featured image (400px height)
   - Post title
   - Publication date

2. **Main Content Area**

   - Background: white
   - Full post content in HTML format
   - Styled HTML elements:
     - h2: 20px, bold, purple
     - h3: 18px, bold, purple
     - h4: 16px, bold, purple
     - Paragraphs: 16px with 1.6 line height
     - Lists: Properly indented with 24px padding
     - Images: Full width with proper spacing
   - Responsive layout

3. **Author Section**

   - Displays all authors in a vertical stack
   - Each author card shows:
     - Profile image
     - Name
     - Username (with GitHub link)
     - Role
     - Bio
   - Cards are separated by subtle borders
   - Last author card has no border

4. **Sidebar (33% width)**
   - Related posts section
     - Shows up to 3 posts from the same category
     - Each related post shows:
       - Featured image (50% width)
       - Title (max 2 lines)
       - Excerpt (max 2 lines)
       - Read More button

## URL Structure

- Blog listing: `/blog`
- Individual posts: `/blog/{slug}` (slug is filename without date prefix)

## Best Practices

1. **Images**

   - Use high-quality images optimized for web
   - Featured images: recommended 1200x800 pixels
   - Author profile images: 120x120 pixels
   - Include fallback images where appropriate
   - Use `/assets/` prefix for blog post images (automatically converted to `/src/assets/`)

2. **Content**

   - Keep titles concise and descriptive
   - Write engaging excerpts (150-200 characters)
   - Format main content in HTML with proper semantic structure
   - Use appropriate heading hierarchy (h2, h3, h4)
   - Include proper spacing and formatting for lists and paragraphs
   - Use SEO-friendly slugs (without date prefix)
   - Maintain consistent date format in frontmatter

3. **Categories**

   - Use predefined categories only
   - Ensure posts are properly categorized
   - Maintain a good balance of content across categories

4. **Trending Posts**

   - Limit number of trending posts
   - Regularly review and update trending status
   - Use high-quality featured images for trending posts

5. **Author Information**

   - Keep bios professional and concise
   - Include relevant role information
   - Use consistent username format
   - Provide high-quality profile images
   - Support multiple authors per post using the `authors` array in frontmatter

6. **Frontmatter**

   - Support both `+++` and `---` delimiters
   - Use either `:` or `=` for key-value pairs
   - Support both single author (`author`) and multiple authors (`authors`)
   - Include all required fields: title, date, excerpt, category, image
   - Optional fields: trending, description

7. **Performance**
   - Optimize all images
   - Use lazy loading for images where appropriate
   - Consider mobile responsiveness
