#!/usr/bin/env node
/**
 * Quick utility to add frontmatter to all reference documentation files
 * that are missing it
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_REF_DIR = path.join(__dirname, 'valkey-astro', 'src', 'content', 'docs', 'reference');

async function addMissingFrontmatter() {
  try {
    const entries = await fs.readdir(DOCS_REF_DIR, { withFileTypes: true });
    const mdFiles = entries.filter(e => e.name.endsWith('.md') && e.isFile());

    console.log(`🔧 Processing ${mdFiles.length} reference documentation files...\n`);

    let updated = 0;
    let skipped = 0;

    for (const file of mdFiles) {
      const filePath = path.join(DOCS_REF_DIR, file.name);
      let content = await fs.readFile(filePath, 'utf-8');

      // Check if file already has frontmatter
      if (content.startsWith('---')) {
        skipped++;
        continue;
      }

      // Extract command name from filename
      const commandName = file.name.replace(/\.md$/, '');
      const titleCase = commandName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .toUpperCase();

      // Create minimal frontmatter
      const frontmatter = `---
title: "${titleCase}"
description: "${titleCase} command reference documentation"
---

`;

      // Add frontmatter to beginning of file
      content = frontmatter + content;
      await fs.writeFile(filePath, content);

      console.log(`✓ Added frontmatter to ${file.name}`);
      updated++;
    }

    console.log(`\n✅ Frontmatter Addition Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingFrontmatter();
