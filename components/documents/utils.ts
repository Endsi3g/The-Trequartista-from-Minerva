import { DocumentBlock, DocumentBlockType } from '@/lib/types';

export function generateBlockId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `blk-${crypto.randomUUID().slice(0, 8)}`
    : `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Converts structured DocumentBlock[] into clean GitHub-flavored Markdown text.
 */
export function blocksToMarkdown(blocks: DocumentBlock[], title?: string): string {
  const lines: string[] = [];
  if (title) {
    lines.push(`# ${title}\n`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case 'heading_1':
        lines.push(`# ${block.content}\n`);
        break;
      case 'heading_2':
        lines.push(`## ${block.content}\n`);
        break;
      case 'heading_3':
        lines.push(`### ${block.content}\n`);
        break;
      case 'paragraph':
        lines.push(`${block.content}\n`);
        break;
      case 'bullet_list':
        lines.push(`- ${block.content}`);
        break;
      case 'numbered_list':
        lines.push(`1. ${block.content}`);
        break;
      case 'todo_list':
        lines.push(`- [${block.checked ? 'x' : ' '}] ${block.content}`);
        break;
      case 'quote':
        lines.push(`> ${block.content}\n`);
        break;
      case 'callout': {
        const type = (block.calloutType || 'note').toUpperCase();
        lines.push(`> [!${type}]\n> ${block.content.replace(/\n/g, '\n> ')}\n`);
        break;
      }
      case 'code_block':
        lines.push(`\`\`\`${block.codeLanguage || ''}\n${block.content}\n\`\`\`\n`);
        break;
      case 'table':
        if (block.tableData && block.tableData.length > 0) {
          const header = block.tableData[0];
          lines.push(`| ${header.join(' | ')} |`);
          lines.push(`| ${header.map(() => ':---').join(' | ')} |`);
          for (let i = 1; i < block.tableData.length; i++) {
            lines.push(`| ${block.tableData[i].join(' | ')} |`);
          }
          lines.push('');
        }
        break;
      case 'divider':
        lines.push('---\n');
        break;
      default:
        lines.push(`${block.content}\n`);
    }
  }

  return lines.join('\n');
}

/**
 * Extracts plain text from blocks for fast search indexing and card summaries.
 */
export function blocksToPlainText(blocks: DocumentBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'table' && b.tableData) {
        return b.tableData.map((row) => row.join(' ')).join('\n');
      }
      return b.content || '';
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Parses raw Markdown text into structured DocumentBlock[] tree.
 */
export function markdownToBlocks(markdown: string): DocumentBlock[] {
  if (!markdown || !markdown.trim()) {
    return [{ id: generateBlockId(), type: 'paragraph', content: '' }];
  }

  const lines = markdown.split('\n');
  const blocks: DocumentBlock[] = [];
  let currentTableData: string[][] | null = null;
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          id: generateBlockId(),
          type: 'code_block',
          content: codeLines.join('\n'),
          codeLanguage: codeLang,
        });
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // Markdown Table parser
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (!isSeparator) {
        if (!currentTableData) {
          currentTableData = [cells];
        } else {
          currentTableData.push(cells);
        }
      }
      continue;
    } else if (currentTableData) {
      blocks.push({
        id: generateBlockId(),
        type: 'table',
        content: 'Tableau',
        tableData: currentTableData,
      });
      currentTableData = null;
    }

    if (!trimmed) {
      continue;
    }

    // Dividers
    if (/^---+$|^\*\*\*+$|^___+$/.test(trimmed)) {
      blocks.push({ id: generateBlockId(), type: 'divider', content: '' });
      continue;
    }

    // Callout alerts (GitHub style: > [!NOTE], > [!TIP], etc.)
    if (trimmed.startsWith('>') && /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO)\]/i.test(trimmed)) {
      const match = trimmed.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO)\]/i);
      const tag = match ? match[1].toUpperCase() : 'NOTE';
      const calloutType: 'info' | 'warning' | 'tip' | 'note' =
        tag === 'WARNING' || tag === 'CAUTION' || tag === 'IMPORTANT'
          ? 'warning'
          : tag === 'TIP'
          ? 'tip'
          : tag === 'INFO'
          ? 'info'
          : 'note';

      const calloutLines: string[] = [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++;
        calloutLines.push(lines[i].trim().replace(/^>\s?/, ''));
      }

      blocks.push({
        id: generateBlockId(),
        type: 'callout',
        content: calloutLines.join('\n'),
        calloutType,
      });
      continue;
    }

    // Quotes
    if (trimmed.startsWith('>')) {
      blocks.push({
        id: generateBlockId(),
        type: 'quote',
        content: trimmed.replace(/^>\s?/, ''),
      });
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      blocks.push({ id: generateBlockId(), type: 'heading_3', content: trimmed.slice(4) });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ id: generateBlockId(), type: 'heading_2', content: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ id: generateBlockId(), type: 'heading_1', content: trimmed.slice(2) });
      continue;
    }

    // Todo lists
    if (/^-\s*\[([ xX])\]\s*(.*)$/.test(trimmed)) {
      const match = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/);
      const checked = match ? match[1].toLowerCase() === 'x' : false;
      const text = match ? match[2] : '';
      blocks.push({ id: generateBlockId(), type: 'todo_list', content: text, checked });
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ id: generateBlockId(), type: 'bullet_list', content: trimmed.slice(2) });
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s+(.*)$/.test(trimmed)) {
      const match = trimmed.match(/^\d+\.\s+(.*)$/);
      blocks.push({ id: generateBlockId(), type: 'numbered_list', content: match ? match[1] : trimmed });
      continue;
    }

    // Paragraph
    blocks.push({ id: generateBlockId(), type: 'paragraph', content: trimmed });
  }

  if (currentTableData) {
    blocks.push({
      id: generateBlockId(),
      type: 'table',
      content: 'Tableau',
      tableData: currentTableData,
    });
  }

  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: 'paragraph', content: '' });
  }

  return blocks;
}
