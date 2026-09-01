export type Role = 'admin' | 'member' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: Role;
  job_title: string;
  department: string;
  phone?: string | null;
  instagram_url?: string | null;
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
  contact_phone?: string | null;
  website_url?: string | null;
  google_business_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  address?: string | null;
  contract_start_date?: string | null;
  service_package?: string | null;
  account_manager_id?: string | null;
  account_manager_name?: string;
  created_at: string;
  current_focus?: string | null;
}

export interface ClientMrrHistoryEntry {
  id: string;
  client_id: string;
  mrr: number;
  note: string | null;
  recorded_at: string;
  created_by: string | null;
  author_name?: string;
  created_at: string;
}

export interface ClientInvite {
  id: string;
  client_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  created_by?: string | null;
  used_by?: string | null;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomRolePermission {
  id: string;
  role_id: string;
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete';
}

export interface Department {
  id: string;
  name: string;
  color: string;
  created_by: string | null;
  created_at: string;
}

export interface HelpArticle {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// 1:1 AI help chatbot on /help (chantier 6).
export interface HelpChatMessage {
  id: string;
  user_id: string;
  user_name?: string;
  role: 'user' | 'assistant';
  content: string;
  conversation_id?: string | null;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  subitems_done?: number;
  subitems_total?: number;
  comments_count?: number;
  plane_issue_id?: string | null;
  plane_sequence_id?: string | null;
  plane_state_id?: string | null;
  plane_last_synced_at?: string | null;
  plane_sync_status?: 'synced' | 'pending' | 'error' | null;
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

export interface ClientWorkItem {
  id: string;
  title: string;
  description: string | null;
  phase_name?: string;
  category: 'Design & UX' | 'Développement' | 'SEO & Ads' | 'Contenu Vidéo' | 'Automation & IA';
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  assignee_name: string;
  assignee_role?: string;
  due_date: string | null;
  deliverable_url?: string | null;
  deliverable_type?: 'figma' | 'framer' | 'video' | 'pdf' | 'document' | null;
  client_feedback?: string | null;
  updated_at: string;
}

export interface ClientActivityLog {
  id: string;
  client_id: string;
  actor_name: string;
  action_type: 'task_started' | 'deliverable_submitted' | 'task_completed' | 'revision_requested' | 'milestone_achieved';
  title: string;
  description: string;
  created_at: string;
}

export interface TeamInvite {
  id: string;
  token: string;
  role: 'admin' | 'member';
  department: string | null;
  custom_role_id: string | null;
  workspace: 'prospection' | 'managing' | 'tech' | null;
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
  sender_name?: string;
  sender_avatar?: string;
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
  budget_cad?: number | null;
  client_visible?: boolean;
}

export interface ProjectAttachment {
  id: string;
  project_id: string;
  name: string;
  url: string;
  file_type: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TeamChatMessage {
  id: string;
  channel_type: 'project' | 'client' | 'dm' | 'topic' | 'coach';
  channel_id: string;
  sender_id: string | null;
  sender_name?: string;
  sender_avatar?: string;
  body: string | null;
  attachment_url?: string | null;
  attachment_type?: 'image' | 'audio' | 'gif' | 'file' | null;
  attachment_name?: string | null;
  parent_message_id?: string | null;
  poll_id?: string | null;
  created_at: string;
}

export interface TeamChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TeamChatMention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  read_at: string | null;
  created_at: string;
}

export interface TeamChatAttachment {
  url: string;
  type: 'image' | 'audio' | 'gif' | 'file';
  name: string;
}

export interface TeamMemberSummary {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone?: string | null;
  instagram_url?: string | null;
}

export interface CoachTaskSnapshotItem {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string | null;
}

export interface StandupResponse {
  id: string;
  user_id: string;
  date: string;
  task_snapshot: CoachTaskSnapshotItem[];
  open_answer: string | null;
  created_at: string;
}

export interface WeeklyCheckinResponse {
  id: string;
  user_id: string;
  week_start: string;
  task_snapshot: CoachTaskSnapshotItem[];
  open_answer: string | null;
  created_at: string;
}

export interface AvailabilityPollSlot {
  label: string;
  iso: string;
}

export interface AvailabilityPoll {
  id: string;
  created_by: string | null;
  question: string;
  proposed_slots: AvailabilityPollSlot[];
  created_at: string;
}

export interface AvailabilityVote {
  poll_id: string;
  user_id: string;
  slot_index: number;
  created_at: string;
}

export interface CoachMemberMemory {
  user_id: string;
  summary: string;
  updated_at: string;
}

export interface CoachWeeklyReport {
  id: string;
  week_start: string;
  user_id: string;
  member_name?: string;
  standups_answered: number;
  standups_total: number;
  response_rate_pct: number;
  trend_summary: string | null;
  is_ghosting: boolean;
  created_at: string;
}

export interface CoachGhostStatus {
  user_id: string;
  member_name?: string;
  consecutive_missed_checkins: number;
  last_activity_at: string | null;
  is_ghosting: boolean;
  last_nudged_at: string | null;
  updated_at: string;
}

export type DocumentBlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo_list'
  | 'quote'
  | 'callout'
  | 'code_block'
  | 'table'
  | 'divider';

export interface DocumentBlock {
  id: string;
  type: DocumentBlockType;
  content: string;
  checked?: boolean;
  calloutType?: 'info' | 'warning' | 'tip' | 'note';
  codeLanguage?: string;
  tableData?: string[][];
}

export interface DocumentContentJson {
  blocks: DocumentBlock[];
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content_json: DocumentContentJson;
  content_text: string;
  created_by: string | null;
  created_at: string;
  creator_name?: string | null;
  creator_avatar?: string | null;
}

export interface TeamDocument {
  id: string;
  title: string;
  content_json?: DocumentContentJson | null;
  content_text?: string | null;
  category?: 'general' | 'product_brief' | 'meeting_notes' | 'spec' | 'sop' | 'proposal' | string;
  is_pinned?: boolean;
  is_shared_with_client?: boolean;
  project_id?: string | null;
  client_id?: string | null;
  workspace?: 'prospection' | 'managing' | 'tech' | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string | null;
  creator_avatar?: string | null;
  client_name?: string | null;
  project_name?: string | null;
}


export interface MinervaRoadmapItem {
  id: string;
  title: string;
  product: string;
  item_type: 'Milestone' | 'Launch' | 'Experiment';
  status: 'Planned' | 'In Progress' | 'Done';
  impact: 'Low' | 'Medium' | 'High';
  start_date?: string | null;
  end_date?: string | null;
  owner_name?: string | null;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: 'pending' | 'done';
  assignee_id?: string | null;
  assignee_name?: string;
  assignee_avatar?: string;
  position: number;
  created_at: string;
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
  format: 'Reel 30s' | 'Reel 60s' | 'Reel 90s' | 'Carrousel' | 'Carrousel IG' | 'Post LinkedIn' | 'Story';
  platform?: 'Instagram' | 'TikTok' | 'YouTube' | 'YouTube Shorts' | 'LinkedIn' | 'Facebook';
  scheduled_date: string;
  status: 'Idéation' | 'Rédigé' | 'Enregistré' | 'Publié';
  thumbnail_url: string;
  video_url?: string;
  caption?: string;
  hashtags?: string[];
  internal_notes?: string;
  client_approval?: 'pending' | 'approved' | 'changes_requested';
  client_feedback?: string | null;
  native_url?: string;
  metrics_views?: number;
  metrics_likes?: number;
  status_history?: ContentPostStatusEvent[];
  created_at?: string;
  updated_at?: string;
}

// "Contenu Minerva" -- the agency's own social content (as opposed to
// ContentPost, which is client deliverables). Two kinds share one row
// shape: 'inspiration' (an external link + note) and 'own_video' (one of
// our own files, optionally scheduled to post).
export interface MinervaContentCategory {
  id: string;
  name: string;
}

export interface MinervaContentItem {
  id: string;
  kind: 'inspiration' | 'own_video';
  title: string;
  category_id: string | null;
  category_name?: string;
  external_url?: string | null;
  note?: string | null;
  file_url?: string | null;
  platform?: string | null;
  format?: string | null;
  scheduled_date?: string | null;
  posted: boolean;
  assignee_id?: string | null;
  assignee_name?: string;
  created_by?: string | null;
  created_at: string;
}

export interface OpusClipResultItem {
  id: string;
  title: string;
  video_url: string;
  drive_file_id?: string | null;
  drive_view_url?: string | null;
}

export interface OpusClipJob {
  id: string;
  source_content_item_id: string | null;
  source_video_url: string;
  title: string;
  opus_project_id: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error_message: string | null;
  clips: OpusClipResultItem[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  category:
    | 'Design Framer'
    | 'Workflows IA'
    | 'IA & Ingénierie'
    | 'Campagnes Ads'
    | 'Loi 25 & Compliance'
    | 'Onboarding'
    | 'Rôles & Rémunération'
    | 'Outils & Systèmes'
    | 'Ventes & Prospection'
    | 'Gestion de compte'
    | 'Support & QA'
    | 'Stratégie & Offre'
    | 'Stratégie & Vision';
  read_time_min: number;
  author: string;
  video_url?: string;
  description: string;
  is_featured?: boolean;
  is_essential?: boolean;
  content_markdown?: string;
  content_json?: DocumentContentJson | null;
  is_onboarding_step?: boolean;
  sort_order?: number | null;
  pillar?: 'flow' | 'reach' | 'agency' | 'inspirations' | 'transversal';
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

export interface Contact {
  id: string;
  full_name: string;
  company: string | null;
  role_title: string | null;
  sector: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  met_at_event: string | null;
  met_at_location: string | null;
  met_at_date: string | null;
  follow_up_date: string | null;
  follow_up_note: string | null;
  converted_to_lead_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  how_can_i_help: string | null;
  biggest_problem: string | null;
  open_to_collaborate: boolean | null;
  preferred_contact_method: 'email' | 'reseaux_sociaux' | 'site_web' | 'autre' | null;
  status: 'a_contacter' | 'rencontre_proposee' | 'entrevue_minerva' | 'collaboration_en_cours';
  source: 'manual' | 'self_submitted';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  body: string;
  channel: 'note' | 'sms' | 'email';
  created_by: string | null;
  author_name?: string;
  created_at: string;
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

// ── Voice Agent (ElevenLabs real call log) ──────────────────────────────────

export interface VoiceCallTranscriptLine {
  sender?: string;
  source?: string;
  message?: string;
  text?: string;
}

export interface VoiceCall {
  id: string;
  elevenlabs_conversation_id: string | null;
  direction: 'inbound' | 'outbound';
  caller_name: string | null;
  caller_phone: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  status: 'completed' | 'abandoned' | 'failed';
  transcript: VoiceCallTranscriptLine[] | null;
  outcome: string | null;
  intake_lead_id: string | null;
  created_at: string;
}

export interface VoiceAgentConfig {
  id: string;
  voice_id: string | null;
  system_prompt: string | null;
  auto_trigger_enabled: boolean;
  auto_trigger_delay_seconds: number;
  updated_by: string | null;
  updated_at: string;
}



// ── Feature Requests (Portail Client & Realtime) ──────────────────────────

export type FeatureRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'planned'
  | 'in_progress'
  | 'in_development'
  | 'testing'
  | 'in_qa'
  | 'delivered'
  | 'declined';

export type FeatureRequestCategory =
  | 'feature'
  | 'improvement'
  | 'optimization'
  | 'ui_ux'
  | 'automation'
  | 'bug'
  | 'integration';

export type FeatureRequestRepo =
  | 'minerva-flow'
  | 'Minerva-Flow'
  | 'trequartista-app'
  | 'The-Trequartista'
  | 'framer-site'
  | 'meta-ads-engine'
  | 'Minerva-Voice-AI'
  | 'Minerva-OS'
  | 'API & Intégrations'
  | 'portal'
  | string;

export type FeatureRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface FeatureRequest {
  id: string;
  client_id: string;
  client_name?: string;
  author_name?: string;
  title: string;
  description: string;
  category: FeatureRequestCategory;
  target_repo?: FeatureRequestRepo;
  repo?: FeatureRequestRepo;
  priority: FeatureRequestPriority;
  status: FeatureRequestStatus;
  admin_notes?: string | null;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Minerva-Flow Metrics & Results ──────────────────────────────────────────

export interface MinervaFlowOrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  orderCount: number;
  totalRevenue: number;
  savingsGenerated: number;
  image?: string;
}

export interface MinervaFlowLiveTicket {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string[];
  totalAmount: number;
  savingsAmount: number;
  prepStatus: 'en_cuisine' | 'prêt' | 'livré';
  timestamp: string;
  pickupType: 'Sur place' | 'Emporter' | 'Livraison directe';
}

export interface MinervaFlowResults {
  clientId: string;
  period: '7d' | '30d' | '90d' | 'ytd';
  totalOrders: number;
  grossVolume: number;
  directSavings: number;
  averageOrderValue: number;
  averagePrepTimeMinutes: number;
  growthPct: number;
  popularItems: MinervaFlowOrderItem[];
  timeline: { date: string; orders: number; revenue: number; savings: number }[];
  recentTickets: MinervaFlowLiveTicket[];
}

// ── Invoicing & Finance Types ───────────────────────────────────────────────

export type InvoiceType = 'invoice' | 'quote' | 'retainer';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceCurrency = 'CAD' | 'USD' | 'EUR';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cad: number;
  amount_cad: number;
  sort_order: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: InvoiceType;
  client_id: string;
  client_name?: string;
  client_email?: string;
  client_company?: string;
  client_avatar_url?: string;
  project_id?: string | null;
  project_name?: string;
  status: InvoiceStatus;
  currency: InvoiceCurrency;
  issue_date: string;
  due_date?: string | null;
  paid_at?: string | null;
  subtotal_cad: number;
  tax_tps_cad: number;
  tax_tvq_cad: number;
  total_cad: number;
  stripe_payment_link_url?: string | null;
  notes?: string | null;
  terms?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface FinancialSummary {
  totalInvoicedCad: number;
  totalCollectedCad: number;
  totalPendingCad: number;
  totalOverdueCad: number;
  mrrCad: number;
  totalQuotesCad: number;
  invoicesCount: number;
  quotesCount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
}

// ── Client Portal & Deliverables Types ─────────────────────────────────────

export type DeliverableType = 'design' | 'website' | 'video' | 'document' | 'campaign' | 'other';
export type DeliverableStatus = 'draft' | 'pending_review' | 'approved' | 'revision_requested';

export interface ClientDeliverable {
  id: string;
  client_id: string;
  project_id?: string | null;
  project_name?: string;
  title: string;
  description?: string | null;
  asset_url?: string | null;
  preview_image_url?: string | null;
  type: DeliverableType;
  status: DeliverableStatus;
  feedback_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientPortalMessage {
  id: string;
  client_id: string;
  author_name: string;
  author_email?: string | null;
  subject?: string | null;
  message: string;
  status: 'unread' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface ClientPortalData {
  client: {
    id: string;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    logo_url?: string | null;
    plan?: string | null;
    health_score?: number | null;
    portal_token: string;
    account_manager_name?: string;
  };
  projects: Array<{
    id: string;
    name: string;
    description?: string | null;
    status: string;
    target_end_date?: string | null;
    milestones: Array<{
      id: string;
      title: string;
      due_date?: string | null;
      completed: boolean;
    }>;
    launch_checks: Array<{
      id: string;
      title: string;
      category?: string | null;
      is_completed: boolean;
    }>;
  }>;
  deliverables: ClientDeliverable[];
  invoices: Invoice[];
  roiMetrics: Array<{
    id: string;
    month: string;
    revenue_generated_cad: number;
    ad_spend_cad: number;
    leads_generated: number;
    conversions: number;
    roi_percentage: number;
  }>;
  messages: ClientPortalMessage[];
  agencyContact: {
    agencyName: string;
    supportEmail: string;
    phone: string;
  };
}

// ── Minerva Flow (SaaS) & Studio Marketplace ───────────────────────────────

export interface MinervaFlowRestaurant {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'bistro' | 'bar' | 'boulangerie' | 'fast_casual';
  address?: string | null;
  city?: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone?: string | null;
  mrr_plan_cad: number;
  orders_count_30d: number;
  revenue_volume_30d: number;
  commission_saved_30d: number;
  health_score: number;
  status: 'active' | 'trial' | 'churn_risk' | 'churned';
  client_id?: string | null;
  pos_connected: boolean;
  qr_menu_active: boolean;
  has_studio_upsell: boolean;
  studio_upsell_notes?: string | null;
  last_active_at?: string;
  connected_at: string;
  created_at?: string;
}

export type StudioPackageCategory =
  | 'production_video'
  | 'web_framer'
  | 'acquisition_ads'
  | 'operations_pos'
  | 'branding';

export interface StudioServicePackage {
  id: string;
  title: string;
  category: StudioPackageCategory;
  description: string;
  price_cad: number;
  recurring: boolean;
  deliverable_days: number;
  features_list: string[];
  is_popular?: boolean;
  icon_name?: string;
}

export interface StudioServiceOrder {
  id: string;
  client_id: string;
  package_id: string;
  package_title?: string;
  package_price_cad?: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'delivered' | 'cancelled';
  total_cad: number;
  stripe_payment_link_url?: string | null;
  notes?: string | null;
  ordered_at: string;
  delivered_at?: string | null;
  created_at?: string;
}

export interface RestaurantAudit {
  id: string;
  restaurant_name: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  monthly_ubereats_volume_cad: number;
  commission_rate_pct: number;
  annual_loss_cad: number;
  projected_flow_savings_cad: number;
  gmb_rating?: number;
  website_url?: string | null;
  audit_token: string;
  status: 'new' | 'viewed' | 'contacted' | 'converted';
  created_at: string;
}

export interface FlowTelemetrySummary {
  total_restaurants: number;
  active_restaurants: number;
  churn_risk_restaurants: number;
  total_revenue_processed_cad: number;
  total_commissions_saved_cad: number;
  mrr_saas_cad: number;
  upsell_opportunities_count: number;
}

// ── Commercial Proposals & e-Signature ───────────────────────────────────────

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'declined' | 'expired';

export interface ProposalPhase {
  phase_number: number;
  title: string;
  duration_weeks: number;
  description: string;
  deliverables: string[];
}

export interface ProposalDeliverableItem {
  id: string;
  title: string;
  category: string;
  description: string;
  price_cad: number;
}

export interface CommercialProposal {
  id: string;
  proposal_number: string;
  title: string;
  client_id?: string | null;
  lead_id?: string | null;
  client_name: string;
  client_email?: string | null;
  client_company?: string | null;
  token: string;
  scope_phases: ProposalPhase[];
  deliverables: ProposalDeliverableItem[];
  subtotal_setup_cad: number;
  tax_tps_cad: number;
  tax_tvq_cad: number;
  total_setup_cad: number;
  total_monthly_cad: number;
  deposit_pct: number;
  deposit_amount_cad: number;
  deposit_paid: boolean;
  deposit_stripe_payment_link?: string | null;
  signature_svg_or_base64?: string | null;
  signer_name?: string | null;
  signer_ip?: string | null;
  signed_at?: string | null;
  terms_and_conditions?: string | null;
  status: ProposalStatus;
  sent_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

// ── RevOps & Team Workload ───────────────────────────────────────────────────

export type TeamSpecialty =
  | 'video_production'
  | 'web_framer'
  | 'ads_acquisition'
  | 'pos_operations'
  | 'generalist';

export interface TeamCapacityProfile {
  profile_id: string;
  full_name: string;
  email?: string | null;
  avatar_url?: string | null;
  specialty: TeamSpecialty;
  weekly_hours_capacity: number;
  monthly_quota_cad: number;
  current_assigned_hours: number;
  utilization_rate_pct: number;
  load_status: 'underloaded' | 'balanced' | 'overloaded';
}

export interface TeamMemberWorkload {
  member_id: string;
  full_name: string;
  email?: string | null;
  specialty: TeamSpecialty;
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  assigned_hours: number;
  capacity_hours: number;
  utilization_pct: number;
  on_time_delivery_rate_pct: number;
  total_commissions_earned_cad: number;
  active_deliverables: Array<{
    id: string;
    title: string;
    client_name: string;
    due_date?: string | null;
    status: string;
  }>;
}

export type CommissionType = 'setup' | 'mrr_recurring' | 'bonus_quota';
export type CommissionStatus = 'pending' | 'approved' | 'paid';

export interface TeamCommission {
  id: string;
  profile_id: string;
  member_name?: string;
  proposal_id?: string | null;
  client_id?: string | null;
  deal_title: string;
  base_amount_cad: number;
  commission_rate_pct: number;
  commission_amount_cad: number;
  type: CommissionType;
  status: CommissionStatus;
  paid_at?: string | null;
  created_at: string;
}

export interface RevOpsSummary {
  total_team_members: number;
  average_team_utilization_pct: number;
  overloaded_members_count: number;
  total_commissions_pending_cad: number;
  total_commissions_paid_cad: number;
  average_deal_velocity_days: number;
  global_on_time_delivery_pct: number;
}

export type TechQaCategory =
  | 'performance'
  | 'security_rls'
  | 'accessibility_seo'
  | 'architecture_api'
  | 'ux_responsive';

export interface TechQaPoint {
  id: string;
  category: TechQaCategory;
  category_label: string;
  title: string;
  description: string;
  passed: boolean;
  critical?: boolean;
  notes?: string;
}

export interface TechQaAudit {
  id: string;
  project_id?: string | null;
  project_name: string;
  target_url?: string | null;
  environment: 'production' | 'staging' | 'preview';
  passed_points: number;
  total_points: number;
  score_percentage: number;
  status: 'passed' | 'failed' | 'in_progress' | 'warning';
  checklist_data: TechQaPoint[];
  audited_by?: string | null;
  auditor_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemServiceHealth {
  name: string;
  key: 'supabase' | 'edge_functions' | 'elevenlabs' | 'notion' | 'vercel';
  status: 'healthy' | 'degraded' | 'down' | 'checking';
  latencyMs: number;
  endpoint?: string;
  description: string;
  lastChecked: string;
}
