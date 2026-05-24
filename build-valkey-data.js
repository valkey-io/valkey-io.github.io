#!/usr/bin/env node
/**
 * Valkey Multi-Source Command Data Ingestion Pipeline
 * Aggregates command metadata from multiple repositories and generates normalized
 * documentation with frontmatter, plus a unified search index
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALKEY_ASTRO_ROOT = path.join(__dirname, 'valkey-astro');
const DOCS_REF_DIR = path.join(VALKEY_ASTRO_ROOT, 'src', 'content', 'docs', 'reference');
const SEARCH_INDEX_FILE = path.join(VALKEY_ASTRO_ROOT, 'src', 'pages', 'search-index.json');

// Repository command sources
const COMMAND_SOURCES = [
  { name: 'valkey', path: path.join(__dirname, 'valkey', 'src', 'commands') },
  { name: 'valkey-bloom', path: path.join(__dirname, 'valkey-bloom', 'src', 'commands') },
  { name: 'valkey-json', path: path.join(__dirname, 'valkey-json', 'src', 'commands') },
  { name: 'valkey-search', path: path.join(__dirname, 'valkey-search', 'src', 'commands') },
];

/**
 * Normalize command metadata to standardized format
 */
function normalizeCommandMetadata(metadata, source) {
  return {
    name: metadata.name || metadata.command || '',
    module: source.name,
    complexity: metadata.complexity || 'unknown',
    version: metadata.version || metadata.since || 'N/A',
    group: metadata.group || metadata.category || 'general',
    acl_categories: metadata.acl_categories || metadata.acl_cat || [],
    arguments: (metadata.arguments || []).map(arg => ({
      name: arg.name || arg.key || '',
      type: arg.type || 'string',
      optional: arg.optional || false,
      description: arg.description || '',
    })),
    description: metadata.description || '',
    examples: metadata.examples || [],
    related_commands: metadata.related_commands || [],
  };
}

/**
 * Generate YAML frontmatter from command metadata
 */
function generateFrontmatter(metadata, filename) {
  const frontmatter = {
    title: metadata.name.toUpperCase(),
    description: metadata.description.substring(0, 160) || `${metadata.name} command reference`,
    keywords: [
      metadata.name.toLowerCase(),
      metadata.group,
      ...metadata.acl_categories,
      metadata.module,
    ].filter(Boolean),
    tags: [metadata.group, metadata.module].filter(Boolean),
    complexity: metadata.complexity,
    version: metadata.version,
    group: metadata.group,
    module: metadata.module,
    acl_categories: metadata.acl_categories,
  };

  let yaml = '---\n';
  Object.entries(frontmatter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      yaml += `${key}:\n`;
      value.forEach(v => {
        yaml += `  - ${JSON.stringify(v)}\n`;
      });
    } else if (typeof value === 'string') {
      yaml += `${key}: "${value.replace(/"/g, '\\"')}"\n`;
    } else {
      yaml += `${key}: ${JSON.stringify(value)}\n`;
    }
  });
  yaml += '---\n';

  return yaml;
}

/**
 * Augment markdown file with frontmatter if missing
 */
async function augmentMarkdownFile(filepath, metadata) {
  try {
    let content = await fs.readFile(filepath, 'utf-8');

    // Check if frontmatter already exists
    if (content.startsWith('---')) {
      return false; // Already has frontmatter
    }

    // Prepend frontmatter
    const frontmatter = generateFrontmatter(metadata, path.basename(filepath));
    content = frontmatter + content;

    await fs.writeFile(filepath, content);
    console.log(`✓ Augmented: ${path.basename(filepath)}`);
    return true;
  } catch (error) {
    console.warn(`⚠ Could not augment ${path.basename(filepath)}: ${error.message}`);
    return false;
  }
}

/**
 * Scan command source directories and aggregate metadata
 */
async function aggregateCommandMetadata() {
  const allCommands = [];

  for (const source of COMMAND_SOURCES) {
    try {
      // Check if source directory exists
      await fs.access(source.path);

      // Recursively find JSON files
      const jsonFiles = await findJsonFiles(source.path);

      for (const jsonFile of jsonFiles) {
        try {
          const rawData = await fs.readFile(jsonFile, 'utf-8');
          const metadata = JSON.parse(rawData);
          const normalized = normalizeCommandMetadata(metadata, source);
          allCommands.push(normalized);
        } catch (parseError) {
          console.warn(`⚠ Failed to parse ${jsonFile}: ${parseError.message}`);
        }
      }

      console.log(`✓ Aggregated ${jsonFiles.length} commands from ${source.name}`);
    } catch (accessError) {
      console.log(`ℹ Source not found: ${source.name} (${source.path})`);
    }
  }

  return allCommands;
}

/**
 * Recursively find JSON files
 */
async function findJsonFiles(dir) {
  const files = [];

  async function traverse(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.name.endsWith('.json')) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.warn(`⚠ Error traversing ${currentPath}: ${err.message}`);
    }
  }

  await traverse(dir);
  return files;
}

/**
 * Match command metadata with markdown documentation
 */
async function matchCommandsWithDocs(commands) {
  const results = [];

  // Get list of markdown files
  let mdFiles = [];
  try {
    const entries = await fs.readdir(DOCS_REF_DIR, { withFileTypes: true });
    mdFiles = entries
      .filter(e => e.name.endsWith('.md') && e.isFile())
      .map(e => path.basename(e.name, '.md'));
  } catch {
    console.warn(`⚠ Reference docs directory not found: ${DOCS_REF_DIR}`);
    return results;
  }

  for (const command of commands) {
    // Create normalized filename candidates
    const nameLower = command.name.toLowerCase().replace(/\s+/g, '-');
    const candidates = [
      `${nameLower}.md`,
      `${command.name.toLowerCase()}.md`,
      `${command.module}-${nameLower}.md`,
    ];

    const matchedFile = candidates.find(c => mdFiles.includes(path.basename(c, '.md')));

    results.push({
      command,
      markdownFile: matchedFile ? path.join(DOCS_REF_DIR, matchedFile) : null,
      matched: !!matchedFile,
    });
  }

  return results;
}

/**
 * Apply frontmatter to all command documentation files
 */
async function applyFrontmatterToCommands(matches) {
  let updated = 0;
  let skipped = 0;

  for (const match of matches) {
    if (match.matched && match.markdownFile) {
      try {
        const success = await augmentMarkdownFile(match.markdownFile, match.command);
        if (success) updated++;
        else skipped++;
      } catch (error) {
        console.warn(`⚠ Error processing ${match.markdownFile}: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Frontmatter Application Results:`);
  console.log(`  ✓ Updated: ${updated}`);
  console.log(`  ⊘ Skipped: ${skipped}`);

  return updated;
}

/**
 * Generate unified search index for all content
 */
async function generateSearchIndex(commands) {
  const searchIndex = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    commands: commands.map(cmd => ({
      id: `cmd-${cmd.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'command',
      name: cmd.name,
      title: cmd.name.toUpperCase(),
      description: cmd.description,
      module: cmd.module,
      group: cmd.group,
      complexity: cmd.complexity,
      keywords: [
        cmd.name.toLowerCase(),
        cmd.group,
        ...cmd.acl_categories,
      ].filter(Boolean),
      url: `/reference/${cmd.name.toLowerCase().replace(/\s+/g, '-')}/`,
    })),
    blogs: [],
    topics: [],
    pages: [],
  };

  // Collect additional documentation types
  try {
    // Add blog posts
    const blogDir = path.join(VALKEY_ASTRO_ROOT, 'src', 'content', 'docs', 'blog');
    const blogFiles = await fs.readdir(blogDir);
    searchIndex.blogs = blogFiles
      .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
      .map(f => ({
        id: `blog-${path.basename(f, path.extname(f))}`,
        type: 'blog',
        filename: f,
        url: `/blog/${path.basename(f, path.extname(f))}/`,
      }));
  } catch {
    console.log('ℹ Blog directory not found');
  }

  try {
    // Add topics
    const topicsDir = path.join(VALKEY_ASTRO_ROOT, 'src', 'content', 'docs', 'topics');
    const topicFiles = await fs.readdir(topicsDir);
    searchIndex.topics = topicFiles
      .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
      .map(f => ({
        id: `topic-${path.basename(f, path.extname(f))}`,
        type: 'topic',
        filename: f,
        url: `/topics/${path.basename(f, path.extname(f))}/`,
      }));
  } catch {
    console.log('ℹ Topics directory not found');
  }

  // Ensure search index directory exists
  const indexDir = path.dirname(SEARCH_INDEX_FILE);
  try {
    await fs.mkdir(indexDir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Write search index
  await fs.writeFile(SEARCH_INDEX_FILE, JSON.stringify(searchIndex, null, 2));
  console.log(`\n✓ Generated search index: ${SEARCH_INDEX_FILE}`);

  return searchIndex;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Valkey Multi-Source Command Data Ingestion Pipeline\n');

  try {
    // Step 1: Aggregate command metadata
    console.log('📦 Step 1: Aggregating command metadata...');
    const commands = await aggregateCommandMetadata();
    console.log(`✓ Total commands aggregated: ${commands.length}\n`);

    // Step 2: Match with markdown documentation
    console.log('📄 Step 2: Matching commands with documentation...');
    const matches = await matchCommandsWithDocs(commands);
    const matchedCount = matches.filter(m => m.matched).length;
    console.log(`✓ Matched: ${matchedCount}/${commands.length} commands\n`);

    // Step 3: Apply frontmatter
    console.log('📝 Step 3: Applying frontmatter to documentation...');
    await applyFrontmatterToCommands(matches);

    // Step 4: Generate search index
    console.log('\n🔍 Step 4: Generating unified search index...');
    const searchIndex = await generateSearchIndex(commands);

    console.log(`\n✅ Pipeline completed successfully!`);
    console.log(`   Commands processed: ${commands.length}`);
    console.log(`   Search index entries: ${searchIndex.commands.length}`);
    console.log(`   Blog posts indexed: ${searchIndex.blogs.length}`);
    console.log(`   Topics indexed: ${searchIndex.topics.length}`);

  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

// Execute pipeline
main();
