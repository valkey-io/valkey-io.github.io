# Participants Documentation

## Data Structure

The `Participant` interface is defined in `src/data/participants.ts` and contains the following properties:

```typescript
interface Participant {
  name: string; // Company/organization name
  desc: string; // Short description for quick preview used in the homepage
  logo: string; // Path to the company logo
  content: string; // HTML-formatted detailed content
}
```

## Content Structure

The `content` field uses HTML formatting with the following structure:

```html
<div class="participant-content">
  <h3>Valkey offering:</h3>
  <p>[Description of the company's Valkey-related offerings]</p>
  <h3>About the company:</h3>
  <p>[General company information]</p>
</div>
```

## Usage in ParticipantsPage

The `ParticipantsPage` component (`src/pages/Participants.tsx`) renders the participants data with the following features:

### Layout

- Responsive design that switches between column and row layouts
- Logo section:
  - Desktop: 30% width with padding
  - Mobile: 80% width with increased top padding
  - Maximum width of 200px

### Styling

The component applies the following styles to the HTML content:

```typescript
sx={{
  'h3': {
    fontSize: 'lg',
    fontWeight: 'bold',
    color: 'secondary.purple.500',
    marginBottom: 2,
    marginTop: 4
  },
  'p': {
    color: 'gray.600',
    marginBottom: 4
  }
}}
```

## Adding New Participants

To add a new participant, append to the `participants` array in `src/data/participants.ts`:

```typescript
{
  name: 'Company Name',
  desc: 'Short description',
  logo: companyLogo,  // Import logo from assets
  content: `
    <div class="participant-content">
      <h3>Valkey offering:</h3>
      <p>Offering description</p>
      <h3>About the company:</h3>
      <p>Company description</p>
    </div>
  `
}
```

## Best Practices

1. **Logo Images**

   - Store logos in `/src/assets/images/`
   - Use SVG format when possible
   - Import logos at the top of the participants.ts file

2. **Content Formatting**

   - Use semantic HTML within the content string
   - Maintain consistent heading hierarchy
   - Keep paragraphs concise and focused

3. **Responsive Design**
   - Test layout on both mobile and desktop views
   - Ensure logos remain clear at different screen sizes
   - Verify content readability across devices
