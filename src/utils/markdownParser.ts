import { FileFrontmatter, TaskProgress } from '../types';

/**
 * Parses frontmatter between --- and ---
 */
export function parseFrontmatter(markdown: string): {
  frontmatter: FileFrontmatter;
  body: string;
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    // Fallback: extract title from first # heading if available
    const firstHeading = markdown.match(/^#\s+(.+)$/m);
    return {
      frontmatter: {
        title: firstHeading ? firstHeading[1].trim() : undefined,
      },
      body: markdown,
    };
  }

  const rawYaml = match[1];
  const body = match[2];
  const frontmatter: FileFrontmatter = {};

  // Simple and robust YAML parser for standard key: value and simple lists
  const lines = rawYaml.split(/\r?\n/);
  let currentArrayKey: string | null = null;
  let currentArray: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Array item e.g. "  - item" or "- item"
    if (trimmed.startsWith('- ') && currentArrayKey) {
      const val = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
      currentArray.push(val);
      continue;
    }

    // New key-value pair e.g. "key: value" or "key: [a, b]" or "key:"
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      // Save previous array if any
      if (currentArrayKey) {
        frontmatter[currentArrayKey] = currentArray;
        currentArrayKey = null;
        currentArray = [];
      }

      const key = line.substring(0, colonIdx).trim();
      const rawVal = line.substring(colonIdx + 1).trim();

      if (!rawVal) {
        // Might be starting a multi-line array
        currentArrayKey = key;
        currentArray = [];
      } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        // Inline array: [item1, item2]
        const items = rawVal
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        frontmatter[key] = items;
      } else {
        let val: any = rawVal.replace(/^["']|["']$/g, '');
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val)) && val !== '') val = Number(val);
        frontmatter[key] = val;
      }
    }
  }

  if (currentArrayKey) {
    frontmatter[currentArrayKey] = currentArray;
  }

  // Ensure title exists
  if (!frontmatter.title) {
    const firstHeading = body.match(/^#\s+(.+)$/m);
    if (firstHeading) {
      frontmatter.title = firstHeading[1].trim();
    }
  }

  return { frontmatter, body };
}

/**
 * Serializes frontmatter back into markdown
 */
export function stringifyWithFrontmatter(
  frontmatter: FileFrontmatter,
  body: string
): string {
  const yamlLines: string[] = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        yamlLines.push(`${key}: []`);
      } else {
        yamlLines.push(`${key}:`);
        for (const item of value) {
          yamlLines.push(`  - "${item}"`);
        }
      }
    } else if (typeof value === 'string') {
      // Quote if contains special characters
      if (value.includes(':') || value.includes('#') || value.includes('[') || value.includes(']')) {
        yamlLines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    } else {
      yamlLines.push(`${key}: ${value}`);
    }
  }

  if (yamlLines.length === 0) {
    return body;
  }

  return `---\n${yamlLines.join('\n')}\n---\n\n${body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trimStart()}`;
}

/**
 * Calculates task progress from checkboxes in markdown
 */
export function getTaskProgress(markdown: string): TaskProgress {
  const checkboxRegex = /^\s*-\s*\[([ xX])\]\s+(.*)$/gm;
  let total = 0;
  let completed = 0;
  let match;

  while ((match = checkboxRegex.exec(markdown)) !== null) {
    total++;
    if (match[1].toLowerCase() === 'x') {
      completed++;
    }
  }

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Toggles the nth checkbox task in the markdown string
 */
export function toggleCheckboxInMarkdown(markdown: string, taskIndex: number): string {
  const checkboxRegex = /^(\s*-\s*\[)([ xX])(\]\s+.*)$/gm;
  let currentIndex = 0;

  return markdown.replace(checkboxRegex, (fullMatch, prefix, checkState, suffix) => {
    if (currentIndex === taskIndex) {
      const newState = checkState.trim() ? ' ' : 'x';
      currentIndex++;
      return `${prefix}${newState}${suffix}`;
    }
    currentIndex++;
    return fullMatch;
  });
}

/**
 * Extracts [[WikiLinks]] or internal references from markdown
 */
export function extractWikiLinks(markdown: string): string[] {
  const wikiRegex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = wikiRegex.exec(markdown)) !== null) {
    if (match[1].trim() && !links.includes(match[1].trim())) {
      links.push(match[1].trim());
    }
  }
  return links;
}

/**
 * Updates wiki-links in markdown content when a file is renamed.
 * Supports [[fileName]], [[fileName.md]], [[fileName|Alias]], [[folder/fileName]] etc.
 */
export function updateWikiLinks(
  markdown: string,
  oldFileName: string,
  newFileName: string
): string {
  const oldBase = oldFileName.replace(/\.md$/, '');
  const newBase = newFileName.replace(/\.md$/, '');
  const oldMd = oldFileName.endsWith('.md') ? oldFileName : `${oldFileName}.md`;
  const newMd = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;

  return markdown.replace(/\[\[(.*?)\]\]/g, (fullMatch, inner) => {
    const parts = inner.split('|');
    const target = parts[0].trim();
    const alias = parts.length > 1 ? `|${parts.slice(1).join('|')}` : '';

    if (target === oldBase) {
      return `[[${newBase}${alias}]]`;
    }
    if (target === oldMd) {
      return `[[${newMd}${alias}]]`;
    }
    if (target.endsWith(`/${oldBase}`)) {
      const prefix = target.slice(0, target.length - oldBase.length);
      return `[[${prefix}${newBase}${alias}]]`;
    }
    if (target.endsWith(`/${oldMd}`)) {
      const prefix = target.slice(0, target.length - oldMd.length);
      return `[[${prefix}${newMd}${alias}]]`;
    }

    return fullMatch;
  });
}
