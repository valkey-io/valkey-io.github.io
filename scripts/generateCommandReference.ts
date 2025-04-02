import axios from 'axios';
import * as fs from 'fs';
import * as marked from 'marked';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Group {
  display: string;
  description: string;
}

interface Command {
  summary: string;
  since: string;
  group: string;
  complexity: string;
  arity: number;
  arguments: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  command_flags: string[];
}

interface CommandCategory {
  id: string;
  categoryName: string;
  description: string;
}

interface CommandReference {
  unid: string;
  command: string;
  description: string;
  htmlContent: string;
  categories: string[];
}

async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error);
    throw error;
  }
}

async function fetchMarkdown(url: string): Promise<string> {
  try {
    // Ensure URL is properly encoded
    const encodedUrl = encodeURI(url);
    console.log(`Fetching markdown from: ${encodedUrl}`);
    
    const response = await axios.get(encodedUrl);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.warn(`Warning: Markdown file not found for ${url}`);
        return ''; // Return empty string for missing files
      }
      console.error(`HTTP Error ${error.response?.status} for ${url}:`, error.message);
    } else {
      console.error(`Error fetching markdown from ${url}:`, error);
    }
    return ''; // Return empty string for any error
  }
}

function transformGroups(groups: Record<string, Group>): CommandCategory[] {
  return Object.entries(groups).map(([id, group]) => ({
    id,
    categoryName: group.display,
    description: group.description
  }));
}

function getMarkdownFileName(command: string): string {
  // First, convert to lowercase and replace spaces with hyphens
  let filename = command.toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-_]/g, '') // Remove any non-alphanumeric characters except hyphens and underscores
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Handle _RO suffix specially
  if (command.endsWith('_RO')) {
    filename = filename.replace(/-ro$/, '_ro');
  }

  // Remove any existing prefixes to prevent duplication
  filename = filename
    .replace(/^cluster-/, '')
    .replace(/^command-/, '')
    .replace(/^config-/, '')
    .replace(/^acl-/, '');

  // Handle special command prefixes
  if (command.startsWith('CLUSTER ')) {
    filename = `cluster-${filename}`;
  } else if (command.startsWith('COMMAND ')) {
    filename = `command-${filename}`;
  } else if (command.startsWith('CONFIG ')) {
    filename = `config-${filename}`;
  } else if (command.startsWith('ACL ')) {
    filename = `acl-${filename}`;
  }

  return filename;
}

async function transformCommands(
  commands: Record<string, Command>,
  baseUrl: string
): Promise<CommandReference[]> {
  const commandRefs: CommandReference[] = [];

  // Create a custom markdown renderer
  const renderer = new marked.Renderer();
  
  // Override the link renderer to handle all .md extensions in paths
  renderer.link = (href, title, text) => {
    if (href) {
      // Handle relative paths and hash fragments
      const [path, hash] = href.split('#');
      const pathParts = path.split('/');
      
      // Remove .md from any part of the path
      const cleanPath = pathParts.map(part => {
        if (part.endsWith('.md')) {
          return part.slice(0, -3);
        }
        return part;
      }).join('/');
      
      // Reconstruct the href with hash if it exists
      href = hash ? `${cleanPath}#${hash}` : cleanPath;
    }
    return `<a href="${href}"${title ? ` title="${title}"` : ''}>${text}</a>`;
  };

  for (const [command, data] of Object.entries(commands)) {
    try {
      const markdownFileName = getMarkdownFileName(command);
      const markdownUrl = `${baseUrl}/commands/${markdownFileName}.md`;
      
      console.log(`Processing command: ${command} -> ${markdownFileName}`);
      
      const markdownContent = await fetchMarkdown(markdownUrl);
      
      if (markdownContent) {
        // Use the custom renderer when parsing markdown
        const htmlContent = await marked.parse(markdownContent, { renderer });

        commandRefs.push({
          unid: `cmd-${markdownFileName}`,
          command,
          description: data.summary,
          htmlContent,
          categories: [data.group]
        });
      }
    } catch (error) {
      console.error(`Error processing command ${command}:`, error);
    }
  }

  return commandRefs;
}

async function generateCommandReference() {
  const baseUrl = 'https://raw.githubusercontent.com/valkey-io/valkey-doc/main';
  
  try {
    console.log('Fetching groups and commands data...');
    
    // Fetch groups and commands data
    const groups = await fetchJson<Record<string, Group>>(`${baseUrl}/groups.json`);
    const commands = await fetchJson<Record<string, Command>>(`${baseUrl}/commands.json`);

    console.log(`Found ${Object.keys(commands).length} commands to process`);

    // Transform the data
    const commandCategories = transformGroups(groups);
    const commandReferences = await transformCommands(commands, baseUrl);

    console.log(`Successfully processed ${commandReferences.length} commands`);

    // Generate TypeScript file content
    const tsContent = `// This file is auto-generated. Do not edit manually.
import { CommandCategory, CommandReference } from '../types/commandReference';

export const commandCategories: CommandCategory[] = ${JSON.stringify(commandCategories, null, 2)};

export const commandReferences: CommandReference[] = ${JSON.stringify(commandReferences, null, 2)};
`;

    // Write to file
    const outputPath = path.join(__dirname, '../src/data/commandReference.ts');
    fs.writeFileSync(outputPath, tsContent);

    console.log('Successfully generated command reference data');
  } catch (error) {
    console.error('Error generating command reference:', error);
    process.exit(1);
  }
}

generateCommandReference(); 