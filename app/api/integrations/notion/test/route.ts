import { NextRequest, NextResponse } from 'next/server';
import type { NotionPage } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const NOTION_VERSION = '2022-06-28';

interface NotionSearchResult {
  id: string;
  object: 'page' | 'database';
  url: string;
  icon: NotionPage['icon'];
  last_edited_time: string;
  parent: {
    type: 'workspace' | 'database_id' | 'page_id';
    [key: string]: unknown;
  };
  properties: Record<string, unknown>;
  title?: Array<{ plain_text: string }>;
}

function extractTitle(obj: NotionSearchResult): string {
  // Database: title is a top-level array
  if (obj.object === 'database' && Array.isArray(obj.title)) {
    return obj.title.map((t) => t.plain_text).join('') || 'Base de données sans titre';
  }
  // Page: title is in properties.title or properties.Name
  const props = obj.properties;
  for (const key of ['title', 'Title', 'Name', 'Nom']) {
    const prop = props?.[key] as { title?: Array<{ plain_text: string }> } | undefined;
    if (prop?.title && Array.isArray(prop.title)) {
      const text = prop.title.map((t) => t.plain_text).join('');
      if (text) return text;
    }
  }
  return 'Page sans titre';
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ valid: false, pages: [], error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || !token.startsWith('secret_')) {
      return NextResponse.json(
        { valid: false, pages: [], error: 'Le token doit commencer par "secret_".' },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    };

    // Validate token by fetching the user
    const userRes = await fetch('https://api.notion.com/v1/users/me', { headers });
    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({})) as { message?: string };
      return NextResponse.json({
        valid: false,
        pages: [],
        error: err?.message ?? `Erreur Notion ${userRes.status}`,
      });
    }
    const user = await userRes.json() as { name?: string; type?: string };

    // Search for accessible pages and databases
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { value: 'page', property: 'object' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 50,
      }),
    });

    const searchData = await searchRes.json() as { results?: NotionSearchResult[] };
    const dbRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { value: 'database', property: 'object' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 50,
      }),
    });
    const dbData = await dbRes.json() as { results?: NotionSearchResult[] };

    const allResults = [
      ...(searchData.results ?? []),
      ...(dbData.results ?? []),
    ];

    const pages: NotionPage[] = allResults.map((obj) => ({
      id: obj.id,
      title: extractTitle(obj),
      url: obj.url,
      icon: obj.icon ?? null,
      last_edited_time: obj.last_edited_time,
      parent_type: (obj.parent?.type ?? 'workspace') as NotionPage['parent_type'],
    }));

    // Sort by last edited
    pages.sort((a, b) => new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime());

    return NextResponse.json({
      valid: true,
      user: user.name ?? 'Utilisateur Notion',
      pages,
    });
  } catch (err) {
    console.error('[notion/test] error:', err);
    return NextResponse.json(
      { valid: false, pages: [], error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
