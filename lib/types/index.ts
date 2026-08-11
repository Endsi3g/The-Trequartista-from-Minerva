export type Role = 'Admin' | 'Manager' | 'Collaborateur';

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

export interface ContentPost {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  format: 'Reel 60s' | 'Carrousel IG' | 'Post LinkedIn' | 'Story';
  scheduled_date: string;
  status: 'Idéation' | 'Rédigé' | 'Enregistré' | 'Publié';
  thumbnail_url: string;
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
