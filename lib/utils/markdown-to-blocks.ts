import type { DocumentBlock, DocumentBlockType } from '@/lib/types';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

// Strips inline markdown emphasis (**bold**, *italic*, `code`, [text](url))
// down to plain text -- the block editor has no inline rich-text spans, so
// keeping literal asterisks/backticks on screen would look broken. Block-level
// structure (headings, lists, quotes, code blocks, tables) is preserved.
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

/**
 * Converts a markdown string (the shape already used by academy_sops.content_markdown)
 * into the flat DocumentBlock[] array the shared BlockEditor renders/edits.
 * One list item / heading / paragraph line = one block, matching BlockEditor's
 * Notion-style model (see components/documents/BlockEditor.tsx).
 */
export function markdownToBlocks(markdown: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let i = 0;
  let pendingTable: string[][] | null = null;

  const flushTable = () => {
    if (pendingTable && pendingTable.length > 0) {
      blocks.push({ id: nextId('table'), type: 'table', content: '', tableData: pendingTable });
    }
    pendingTable = null;
  };

  const push = (type: DocumentBlockType, content: string, extra: Partial<DocumentBlock> = {}) => {
    blocks.push({ id: nextId(type), type, content: stripInlineMarkdown(content), ...extra });
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Fenced code block
    if (line.startsWith('```')) {
      flushTable();
      const codeLanguage = line.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ id: nextId('code'), type: 'code_block', content: codeLines.join('\n'), codeLanguage });
      i += 1;
      continue;
    }

    // Table row (| a | b |), skip the |---|---| separator row
    if (/^\|.*\|$/.test(line)) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => stripInlineMarkdown(c.trim()));
      const isSeparatorRow = cells.every((c) => /^:?-{2,}:?$/.test(c));
      if (!isSeparatorRow) {
        pendingTable = pendingTable || [];
        pendingTable.push(cells);
      }
      i += 1;
      continue;
    }
    flushTable();

    // Blank line -- just a separator, no empty paragraph block
    if (line === '') {
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line) || /^\*{3,}$/.test(line)) {
      blocks.push({ id: nextId('div'), type: 'divider', content: '' });
      i += 1;
      continue;
    }

    // Headings
    const h3 = line.match(/^#{3,6}\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h3) {
      push('heading_3', h3[1]);
      i += 1;
      continue;
    }
    if (h2) {
      push('heading_2', h2[1]);
      i += 1;
      continue;
    }
    if (h1) {
      push('heading_1', h1[1]);
      i += 1;
      continue;
    }

    // Blockquote (including a leading "> " used for callout-style asides)
    const quote = line.match(/^>\s?(.*)/);
    if (quote) {
      push('quote', quote[1]);
      i += 1;
      continue;
    }

    // Todo list
    const todo = line.match(/^[-*]\s+\[( |x|X)\]\s+(.*)/);
    if (todo) {
      push('todo_list', todo[2], { checked: todo[1].toLowerCase() === 'x' });
      i += 1;
      continue;
    }

    // Bullet list
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      push('bullet_list', bullet[1]);
      i += 1;
      continue;
    }

    // Numbered list
    const numbered = line.match(/^\d+\.\s+(.*)/);
    if (numbered) {
      push('numbered_list', numbered[1]);
      i += 1;
      continue;
    }

    // Plain paragraph
    push('paragraph', line);
    i += 1;
  }

  flushTable();
  return blocks;
}
