import fs from 'fs';
import matter from 'gray-matter';
import https from 'https';
import { marked } from 'marked';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked for proper HTML generation
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
});

// Create a custom renderer to handle .md extensions in links
const renderer = new marked.Renderer();
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

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
}

// Function to fetch content from GitHub
async function fetchFromGitHub(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/valkey-io/valkey-doc/main/${path}`;
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Function to fetch list of markdown files from GitHub
async function fetchMarkdownFiles(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = 'https://api.github.com/repos/valkey-io/valkey-doc/contents/topics';
    
    https.get(url, {
      headers: {
        'User-Agent': 'Valkey-Doc-Generator'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const files = JSON.parse(data)
            .filter((file: GitHubFile) => file.name.endsWith('.md'))
            .map((file: GitHubFile) => file.name);
          resolve(files);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Function to process markdown files from GitHub
async function processMarkdownFiles(): Promise<CommandCategory[]> {
  const topicsPath = 'topics';
  const files = await fetchMarkdownFiles();
  
  const topics: CommandCategory[] = [];
  
  for (const file of files) {
    try {
      const content = await fetchFromGitHub(`${topicsPath}/${file}`);
      const { data, content: markdownContent } = matter(content);
      
      // Convert markdown to HTML with full formatting and custom renderer
      const htmlContent = marked.parse(markdownContent, { renderer }) as string;
      
      topics.push({
        id: path.basename(file, '.md'),
        topicName: data.title || path.basename(file, '.md'),
        description: data.description || '',
        htmlContent
      });
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  return topics;
}

// Function to organize topics by category
function organizeCategories(topics: CommandCategory[]): TopicCategory[] {
  const categoryMap: { [key: string]: string[] } = {
    'GETTING STARTED': [
      'introduction',
      'quickstart',
      'installation',
      'faq',
      'history',
      'license'
    ],
    'CONFIGURATION & SETUP': [
      'acl',
      'cli',
      'valkey.conf',
      'server',
      'key-specs',
      'keyspace'
    ],
    'CLIENT HANDLING': [
      'clients',
      'client-side-caching',
      'protocol',
      'sentinel-clients'
    ],
    'DATA TYPES': [
      'data-types',
      'strings',
      'lists',
      'sets',
      'sorted-sets',
      'hashes',
      'streams-intro',
      'geospatial',
      'hyperloglogs',
      'bitmaps',
      'bitfields'
    ],
    'SCRIPTING & PROGRAMMING': [
      'eval-intro',
      'lua-api',
      'functions-intro',
      'programmability',
      'command-arguments',
      'command-tips'
    ],
    'MODULES': [
      'modules-intro',
      'modules-api-ref',
      'modules-blocking-ops',
      'modules-native-types'
    ],
    'HIGH AVAILABILITY': [
      'replication',
      'sentinel',
      'cluster-tutorial',
      'cluster-spec',
      'distlock'
    ],
    'ADMINISTRATION': [
      'admin',
      'security',
      'encryption',
      'persistence',
      'signals',
      'memory-optimization',
      'migration',
      'releases'
    ],
    'PERFORMANCE & MONITORING': [
      'pipelining',
      'latency-monitor',
      'latency',
      'performance-on-cpu',
      'benchmark',
      'mass-insertion',
      'lru-cache',
      'indexing'
    ],
    'TROUBLESHOOTING': [
      'problems',
      'debugging',
      'ldb'
    ],
    'EXAMPLES & TUTORIALS': [
      'twitter-clone'
    ],
    'HARDWARE & OPTIMIZATION': [
      'ARM',
      'RDMA'
    ]
  };

  return Object.entries(categoryMap).map(([title, ids]) => ({
    title,
    items: topics.filter(topic => ids.includes(topic.id))
  }));
}

// Main function to generate the topics.ts file
async function generateTopicsFile() {
  try {
    const topics = await processMarkdownFiles();
    const categories = organizeCategories(topics);

    const fileContent = `// This file is auto-generated. Do not edit manually.
import { CommandCategory, TopicCategory } from './types';

export const topics: CommandCategory[] = ${JSON.stringify(topics, null, 2)};

export const categories: TopicCategory[] = ${JSON.stringify(categories, null, 2)};
`;

    fs.writeFileSync(
      path.join(path.dirname(__dirname), 'src/data/topics.ts'),
      fileContent
    );

    console.log('Successfully generated topics.ts');
  } catch (error) {
    console.error('Error generating topics.ts:', error);
    process.exit(1);
  }
}

// Run the generator
generateTopicsFile(); 