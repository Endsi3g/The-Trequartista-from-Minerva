import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NOTION_VERSION = '2022-06-28';

interface RichText {
  plain_text: string;
}

interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

// Flattens a Notion block's type-specific rich_text array to plain text --
// covers the block types that actually appear in SOP-style docs (headings,
// paragraphs, lists, quotes, callouts, to-dos). Unrecognized block types
// (embeds, images, tables) are skipped rather than guessed at.
function blockToText(block: NotionBlock): string {
  const data = block[block.type] as { rich_text?: RichText[] } | undefined;
  const text = data?.rich_text?.map((rt) => rt.plain_text).join('') ?? '';
  if (!text) return '';
  switch (block.type) {
    case 'heading_1':
      return `\n# ${text}\n`;
    case 'heading_2':
      return `\n## ${text}\n`;
    case 'heading_3':
      return `\n### ${text}\n`;
    case 'bulleted_list_item':
      return `- ${text}`;
    case 'numbered_list_item':
      return `1. ${text}`;
    case 'to_do':
      return `- [ ] ${text}`;
    case 'quote':
      return `> ${text}`;
    default:
      return text;
  }
}

async function fetchPageContent(pageId: string, headers: Record<string, string>): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined;
  // One level deep -- SOP pages are typically flat; nested toggles/sub-pages
  // are skipped rather than recursed into indefinitely.
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${pageId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) break;
    const data = (await res.json()) as { results: NotionBlock[]; has_more: boolean; next_cursor: string | null };
    for (const block of data.results) {
      const line = blockToText(block);
      if (line) lines.push(line);
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return lines.join('\n').trim();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
  }

  const { token, pages } = await req.json().catch(() => ({ token: null, pages: null }));
  if (!token || typeof token !== 'string' || !token.startsWith('secret_')) {
    return NextResponse.json({ error: 'Token Notion manquant ou invalide.' }, { status: 400 });
  }
  if (!Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json({ error: 'Aucune page sélectionnée.' }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };

  const imported: string[] = [];
  const failed: string[] = [];

  for (const page of pages as Array<{ id: string; title: string }>) {
    try {
      const content = await fetchPageContent(page.id, headers);
      if (!content) {
        failed.push(`${page.title} (page vide)`);
        continue;
      }
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const readTimeMin = Math.max(1, Math.round(wordCount / 200));

      const { error } = await supabase.from('academy_sops').upsert(
        {
          title: page.title,
          category: 'Notion',
          author: profile?.full_name || 'Import Notion',
          description: content.slice(0, 8000),
          read_time_min: readTimeMin,
          notion_page_id: page.id,
        },
        { onConflict: 'notion_page_id' }
      );

      if (error) {
        console.error('[notion/import] upsert error:', error);
        failed.push(page.title);
      } else {
        imported.push(page.title);
      }
    } catch (err) {
      console.error('[notion/import] page fetch error:', err);
      failed.push(page.title);
    }
  }

  return NextResponse.json({ imported, failed });
}
