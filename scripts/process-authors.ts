import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

interface Author {
  name: string;
  username: string;
  bio: string;
  imageUrl: string;
  role: string;
  githubUser?: string;
}

interface AuthorExtra {
  photo?: string;
  github?: string;
}

interface AuthorData {
  name?: string;
  title?: string;
  username?: string;
  bio?: string;
  imageUrl?: string;
  role?: string;
  content?: string;
  extra?: AuthorExtra;
}

// Map different frontmatter formats to our Author structure
function mapAuthorData(data: AuthorData, filename: string): Author {
  // Handle the case where name is in title field
  const name = data.name || data.title || '';
  
  // Handle the case where image is in extra.photo
  const imageUrl = data.imageUrl || data.extra?.photo || '/assets/media/authors/default.jpg';
  
  // Extract username from filename (remove .md extension)
  const username = path.basename(filename, '.md');
  
  // Get GitHub user from extra.github if available
  const githubUser = data.extra?.github;
  
  // Use the content as bio if no bio field is present
  const bio = data.bio || data.content || '';
  
  // Default role if not provided
  const role = data.role || 'Contributor';

  return {
    name,
    username,
    bio,
    imageUrl,
    role,
    githubUser
  };
}

// Validate author data
function validateAuthor(data: AuthorData, filename: string): Author {
  const mappedData = mapAuthorData(data, filename);
  const requiredFields = ['name', 'username', 'bio', 'imageUrl', 'role'];
  const missingFields = requiredFields.filter(field => !mappedData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return mappedData;
}

// Process a single markdown file into an author
function processAuthorFile(filePath: string): Author {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data, content: markdownContent } = matter(content);
  const filename = path.basename(filePath);
  
  try {
    // Add the markdown content to the data for bio extraction
    const dataWithContent = {
      ...data,
      content: markdownContent.trim()
    };
    return validateAuthor(dataWithContent, filename);
  } catch (error) {
    console.error(`Error processing author file ${filePath}:`, error);
    throw error;
  }
}

// Main function to process all authors
function processAuthors() {
  const authorsDir = path.join(process.cwd(), 'public/content/authors');
  
  try {
    if (!fs.existsSync(authorsDir)) {
      console.error(`Authors directory not found: ${authorsDir}`);
      return;
    }

    const files = fs.readdirSync(authorsDir);
    const authors = files
      .filter(file => file.endsWith('.md') && !file.startsWith('_')) // Ignore files starting with underscore
      .map(file => processAuthorFile(path.join(authorsDir, file)));

    // Sort authors by name
    authors.sort((a, b) => a.name.localeCompare(b.name));

    // Generate the authors.ts content
    const authorsContent = `// This file is auto-generated. Do not edit manually.
import { Author } from './types';

export const authors: Author[] = ${JSON.stringify(authors, null, 2)};
`;

    // Write the generated content to authors.ts
    fs.writeFileSync(
      path.join(process.cwd(), 'src/data/authors.ts'),
      authorsContent
    );

    console.log(`Successfully processed ${authors.length} authors`);
  } catch (error) {
    console.error('Failed to process authors:', error);
    process.exit(1);
  }
}

// Run the script
processAuthors(); 