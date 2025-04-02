import axios from 'axios';
import fs from 'fs';
import { marked } from 'marked';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  zipball_url: string;
  tarball_url: string;
}

interface ReleaseNote {
  version: string;
  releaseDate: string;
  sections: {
    title: string;
    items: string[];
  }[];
  sourceCodeUrl: string;
}

interface ReleaseGroup {
  majorVersion: string;
  releases: {
    version: string;
    releaseDate: string;
    url: string;
  }[];
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  try {
    const response = await axios.get('https://api.github.com/repos/valkey-io/valkey/releases');
    return response.data;
  } catch (error) {
    console.error('Error fetching releases:', error);
    throw error;
  }
}

function getMajorVersion(version: string): string {
  const match = version.match(/^(\d+)\./);
  return match ? `${match[1]}.X.X` : version;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

function parseReleaseNotes(release: GitHubRelease): ReleaseNote {
  // Parse the markdown content
  const tokens = marked.lexer(release.body);
  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;
  let releaseDate = new Date(release.published_at).toLocaleDateString();

  // Process each token
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1) {
      const title = token.text;
      
      // Check for release date in the title
      const releaseDateMatch = title.match(/Released\s+(\w+\s+\d+\s+\w+\s+\d{4})/i);
      if (releaseDateMatch) {
        releaseDate = releaseDateMatch[1];
        continue;
      }

      // Skip the version title and urgency info
      if (!title.includes(release.tag_name) && !title.toLowerCase().includes('urgency')) {
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title,
          items: []
        };
      }
    } else if (token.type === 'list' && currentSection) {
      // Process list items
      for (const item of token.items) {
        if (item.type === 'list_item') {
          // Get the text content of the list item
          const itemText = item.text.trim();
          if (itemText) {
            currentSection.items.push(itemText);
          }
        }
      }
    }
  }

  // Add the last section if it has items
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  // Add Assets section
  sections.push({
    title: "Assets",
    items: [
      `Source code (zip): ${release.zipball_url}`,
      `Source code (tar.gz): ${release.tarball_url}`,
      `View on GitHub: https://github.com/valkey-io/valkey/tree/${release.tag_name}`
    ]
  });

  return {
    version: release.tag_name,
    releaseDate,
    sections: sections.filter(s => s.title && s.items.length > 0),
    sourceCodeUrl: `https://github.com/valkey-io/valkey/tree/${release.tag_name}`
  };
}

function organizeReleases(releases: GitHubRelease[]): {
  latest: GitHubRelease;
  previousGroups: ReleaseGroup[];
} {
  // Sort releases by version number
  const sortedReleases = releases.sort((a, b) => {
    const aVersion = a.tag_name.replace(/^v/, '').split('-')[0].split('.').map(Number);
    const bVersion = b.tag_name.replace(/^v/, '').split('-')[0].split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (aVersion[i] !== bVersion[i]) {
        return bVersion[i] - aVersion[i];
      }
    }
    
    const aIsRC = a.tag_name.includes('-rc');
    const bIsRC = b.tag_name.includes('-rc');
    if (aIsRC !== bIsRC) {
      return aIsRC ? 1 : -1;
    }
    
    return 0;
  });

  const latest = sortedReleases[0];
  const previousReleases = sortedReleases.slice(1);

  // Group by major version
  const groups = new Map<string, ReleaseGroup>();
  
  for (const release of previousReleases) {
    const majorVersion = getMajorVersion(release.tag_name);
    if (!groups.has(majorVersion)) {
      groups.set(majorVersion, {
        majorVersion,
        releases: [],
      });
    }
    
    groups.get(majorVersion)!.releases.push({
      version: release.tag_name,
      releaseDate: formatDate(release.published_at),
      url: `https://github.com/valkey-io/valkey/releases/tag/${release.tag_name}`,
    });
  }

  return {
    latest,
    previousGroups: Array.from(groups.values())
      .sort((a, b) => {
        const aVersion = parseInt(a.majorVersion);
        const bVersion = parseInt(b.majorVersion);
        return bVersion - aVersion;
      }),
  };
}

async function updateReleaseNotesFile() {
  try {
    const releases = await fetchReleases();
    const { latest, previousGroups } = organizeReleases(releases);
    
    console.log(`Processing release notes for version ${latest.tag_name}...`);
    const releaseNotes = parseReleaseNotes(latest);
    console.log('Parsed sections:', releaseNotes.sections.length);

    // Create the TypeScript content
    const tsContent = `export interface ReleaseNote {
  version: string;
  releaseDate: string;
  sections: {
    title: string;
    items: string[];
  }[];
  sourceCodeUrl: string;
}

export interface Release {
  version: string;
  releaseDate: string;
  url: string;
}

export interface ReleaseGroup {
  majorVersion: string;
  releases: Release[];
}

export const releaseNotes: ReleaseNote = ${JSON.stringify(releaseNotes, null, 2)};

export const previousReleases: ReleaseGroup[] = ${JSON.stringify(previousGroups, null, 2)};
`;

    // Write to the releaseNotes.ts file
    const filePath = path.join(__dirname, '../src/data/releaseNotes.ts');
    fs.writeFileSync(filePath, tsContent);
    
    console.log('Release notes updated successfully!');
  } catch (error) {
    console.error('Error updating release notes:', error);
    process.exit(1);
  }
}

// Run the script
updateReleaseNotesFile(); 