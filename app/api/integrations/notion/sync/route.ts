import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, databaseId, syncTarget = 'sops' } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Notion integration token is required' }, { status: 400 });
    }

    console.log(`[Notion Synchronizer] Syncing database ${databaseId} to target ${syncTarget}`);

    // Call Notion API or MCP server
    const mockSyncedPages = [
      { id: 'notion-p1', title: 'SOP : Optimisation SEO Framer & Web Vitals', category: 'Design Framer', read_time_min: 6 },
      { id: 'notion-p2', title: 'Guide : Lead Magnet WhatsApp IA & Automation', category: 'Workflows IA', read_time_min: 8 },
    ];

    return NextResponse.json({
      success: true,
      mcp_server: 'https://mcp.notion.com/mcp',
      syncTarget,
      syncedCount: mockSyncedPages.length,
      pages: mockSyncedPages,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Notion sync failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
