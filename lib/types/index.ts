export type Role = 'admin' | 'member' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: Role;
  job_title: string;
  department: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  logo_url: string;
  industry: string;
  status: 'Active' | 'Onboarding' | 'Paused' | 'Archived';
  mrr: number;
  health_status: 'Ready' | 'On Track' | 'At Risk';
  contact_name: string;
  contact_email: string;
  created_at: string;
  current_focus?: string | null;
}

export interface ClientInvite {
  id: string;
  client_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  version: string | null;
  included_items: string[];
  created_by: string | null;
  author_name?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  project_name?: string;
  client_id: string | null;
  client_name?: string;
  lead_id: string | null;
  lead_name?: string;
  assignee_id: string | null;
  assignee_name?: string;
  assignee_avatar_url?: string | null;
  created_by: string | null;
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  subitems_done?: number;
  subitems_total?: number;
  comments_count?: number;
}

export interface TaskSubitem {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  author_name?: string;
  body: string;
  created_at: string;
}

export interface TeamInvite {
  id: string;
  token: string;
  role: 'admin' | 'member';
  department: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

export interface ClientMessage {
  id: string;
  client_id: string;
  sender_id: string;
  sender_role: 'client' | 'team';
  body: string;
  created_at: string;
}

export interface ClientPaymentLink {
  id: string;
  client_id: string;
  client_name?: string;
  stripe_payment_link_id: string;
  url: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired';
  paid_at: string | null;
  created_at: string;
}

export interface ClientRoiMetrics {
  id: string;
  client_id: string;
  leads_sent_30d: number;
  leads_change_pct: number;
  sales_completed: number;
  conversion_rate_pct: number;
  cost_per_lead: number;
  pipeline_value: number;
  roi_multiplier: number;
  total_invested: number;
  total_generated: number;
  top_keywords_rank_top3: number;
  total_keywords_tracked: number;
  gmb_reviews_count: number;
  gmb_rating: number;
  gmb_calls_count: number;
  google_ads_spent: number;
  google_ads_leads: number;
  google_ads_roas: number;
  weekly_leads_trend: number[];
}

export interface Project {
  id: string;
  client_id: string;
  client_name: string;
  name: string;
  current_stage: 'Onboarding' | 'Design Framer' | 'Launch Check' | 'Live Production';
  health: 'Ready' | 'On Track' | 'Needs Review';
  progress_pct: number;
  due_date: string;
  assignees: string[];
}

export interface ProjectRoadmapStep {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: 'Framer Website' | 'Google Business' | 'WhatsApp AI Bot' | 'Missed-call Text-back';
  status: 'Completed' | 'In Progress' | 'Pending';
  due_date: string;
}

export interface LaunchCheckItem {
  id: number;
  title: string;
  description: string;
  category: 'UX/UI & Design' | 'SEO & Content' | 'Conversion & Analytics' | 'Performance & Legal';
  checked: boolean;
}

export interface LaunchChecklist {
  project_id: string;
  score_pct: number;
  items: LaunchCheckItem[];
}

export interface ContentPostStatusEvent {
  status: string;
  changed_at: string;
}

export interface ContentPost {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  format: 'Reel 60s' | 'Carrousel IG' | 'Post LinkedIn' | 'Story';
  platform?: 'Instagram' | 'TikTok' | 'YouTube Shorts' | 'LinkedIn';
  scheduled_date: string;
  status: 'Idéation' | 'Rédigé' | 'Enregistré' | 'Publié';
  thumbnail_url: string;
  video_url?: string;
  caption?: string;
  hashtags?: string[];
  script_notes?: string;
  internal_notes?: string;
  native_url?: string;
  metrics_views?: number;
  metrics_likes?: number;
  status_history?: ContentPostStatusEvent[];
  created_at?: string;
  updated_at?: string;
}


export interface TeamOKR {
  id: string;
  title: string;
  target_pct: number;
  current_pct: number;
}

export interface SkillRating {
  skill: string;
  level: 'Expert' | 'Avancé' | 'En apprentissage' | 'Fondation';
}

export interface TeamMemberPerformance {
  id: string;
  profile_id: string;
  full_name: string;
  role: string;
  avatar_url: string;
  next_1on1_date: string;
  okrs: TeamOKR[];
  skills: SkillRating[];
  feedbacks_count: number;
}

export interface AcademySOP {
  id: string;
  title: string;
  category: 'Design Framer' | 'Workflows IA' | 'Campagnes Ads' | 'Loi 25 & Compliance';
  read_time_min: number;
  author: string;
  video_url?: string;
  description: string;
}

// ── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'coming_soon';

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  connected_at?: string;
  metadata?: Record<string, unknown>;
}

// ── Notion ────────────────────────────────────────────────────────────────────

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  icon?: { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } } | null;
  last_edited_time: string;
  parent_type: 'workspace' | 'database_id' | 'page_id';
}

export interface NotionConfig {
  id: string;
  user_id: string;
  integration_token_hash: string; // stored hashed, never raw
  connected_at: string;
  workspace_name: string;
  workspace_icon?: string;
  linked_page_ids: string[];
}

// ── Alerts (real-time, from Supabase) ────────────────────────────────────────

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  url: string;
  resolved: boolean;
  created_at: string;
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id?: string;
  actor_name: string;
  actor_email?: string;
  details: Record<string, unknown>;
  created_at: string;
}

// ── Lead CRM ───────────────────────────────────────────────────────────────

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note?: string | null;
}

export type LeadStage = 'nouveau' | 'qualification' | 'proposition' | 'negociation' | 'gagne' | 'perdu';

export interface Lead {
  id: string;
  client_id?: string;
  client_name: string;
  company_name?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  service_requested: string;
  score_grade: 'A' | 'B' | 'C' | 'D';
  status: 'Nouveau' | 'Contacté' | 'RDV Fixé' | 'Gagné' | 'Perdu';
  stage?: LeadStage;
  mrr_value?: number;
  one_time_value?: number;
  probability_pct?: number;
  notes: LeadNote[];
  created_at: string;
}

// ── Acquisition: intake, audits, proposals ──────────────────────────────────

export interface IntakeLead {
  id: string;
  first_name: string;
  phone: string;
  email?: string | null;
  status: 'step1_abandoned' | 'qualified' | 'converted' | 'discarded';
  qualification_data: Record<string, unknown>;
  source: string;
  sms_follow_up_status: 'pending' | 'sent' | 'failed' | 'skipped_qualified' | 'skipped_no_config';
  sms_follow_up_sent_at?: string | null;
  qualified_at?: string | null;
  crm_lead_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: string;
  intake_lead_id?: string | null;
  client_id?: string | null;
  crm_lead_id?: string | null;
  prospect_name: string;
  status: 'awaiting_transcript' | 'transcript_ready' | 'extracting' | 'extracted' | 'reviewed' | 'proposal_sent';
  transcript_source?: 'granola' | 'manual_paste' | null;
  transcript_raw?: string | null;
  transcript_fetched_at?: string | null;
  extraction_raw?: unknown;
  extraction_error?: string | null;
  view_token?: string | null;
  view_token_expires_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditProcessStep {
  id: string;
  audit_id: string;
  title: string;
  description?: string | null;
  role_involved?: string | null;
  is_bottleneck: boolean;
  is_duplicate_entry: boolean;
  source_quote?: string | null;
  sort_order: number;
}

export interface AuditCostItem {
  id: string;
  audit_id: string;
  task_description: string;
  role_name: string;
  hours_wasted_per_week: number;
  hourly_rate_cad?: number | null;
  annual_cost_cad?: number | null;
  source_quote?: string | null;
}

export interface AuditToolFinding {
  id: string;
  audit_id: string;
  tool_name: string;
  category?: string | null;
  has_rest_api?: boolean | null;
  has_graphql_api?: boolean | null;
  integration_feasibility: 'high' | 'medium' | 'low' | 'unknown';
  notes?: string | null;
}

export interface AuditInitiative {
  id: string;
  audit_id: string;
  title: string;
  description?: string | null;
  impact_score: number;
  effort_score: number;
  sort_order: number;
}

export interface AuditInitiativeReaction {
  id: string;
  initiative_id: string;
  reaction: 'interested' | 'not_priority';
  created_at: string;
}

export interface AuditComment {
  id: string;
  audit_id: string;
  target_type: 'process_step' | 'cost_item' | 'initiative' | 'general';
  target_id?: string | null;
  author: string;
  body: string;
  created_at: string;
}

export interface AuditWithFindings extends Audit {
  process_steps: AuditProcessStep[];
  cost_items: AuditCostItem[];
  tool_findings: AuditToolFinding[];
  initiatives: AuditInitiative[];
  reactions: AuditInitiativeReaction[];
  comments: AuditComment[];
}

export interface RoleHourlyRate {
  id: string;
  role_name: string;
  hourly_rate_cad: number;
  updated_at: string;
  updated_by?: string | null;
}

export interface ToolCompatibilityEntry {
  id: string;
  tool_name: string;
  category?: string | null;
  has_rest_api?: boolean | null;
  has_graphql_api?: boolean | null;
  integration_feasibility: 'high' | 'medium' | 'low' | 'unknown';
  api_notes?: string | null;
  updated_at: string;
}

export interface Proposal {
  id: string;
  audit_id: string;
  status: 'draft' | 'generated' | 'sent' | 'failed';
  pdf_storage_path?: string | null;
  calendly_link?: string | null;
  brevo_message_id?: string | null;
  sent_at?: string | null;
  send_error?: string | null;
  created_by?: string | null;
  created_at: string;
}


