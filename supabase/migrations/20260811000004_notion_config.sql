-- Migration: Notion Configuration & MCP Server Integration Table

CREATE TABLE IF NOT EXISTS public.notion_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  integration_token_hash TEXT NOT NULL,
  workspace_name TEXT DEFAULT 'Workspace Notion',
  workspace_icon TEXT,
  mcp_server_url TEXT DEFAULT 'https://mcp.notion.com/mcp',
  linked_page_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notion_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow team read notion_config" ON public.notion_config FOR SELECT USING (true);
CREATE POLICY "Allow team write notion_config" ON public.notion_config FOR ALL USING (true);

-- Attach Audit Trigger
DROP TRIGGER IF EXISTS trigger_audit_notion_config ON public.notion_config;
CREATE TRIGGER trigger_audit_notion_config
  AFTER INSERT OR UPDATE OR DELETE ON public.notion_config
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
