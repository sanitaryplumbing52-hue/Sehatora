export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  avatar?: string | null;
  job_title?: string;
  role: string | null;
  role_name?: string;
  team: string | null;
  team_name?: string;
  is_active: boolean;
  is_org_owner: boolean;
  is_superuser?: boolean;
  organization?: string;
  organization_name?: string;
  permissions?: Record<string, string[]>;
}

export interface Paginated<T> {
  count: number;
  num_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  company: string | null;
  company_name?: string;
  job_title: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  lead_source: string;
  lead_status: string;
  lifecycle_stage: string;
  owner: string | null;
  owner_name?: string;
  tags: Tag[];
  notes?: string;
  avatar?: string | null;
  lead_score: number;
  created_at: string;
  updated_at?: string;
  last_activity_at: string | null;
  last_contacted_at?: string | null;
  next_follow_up_at: string | null;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  employees?: string;
  annual_revenue?: string | number;
  owner: string | null;
  owner_name?: string;
  tags: Tag[];
  notes?: string;
  logo?: string | null;
  contact_count?: number;
  deal_count?: number;
  open_deal_value?: number;
  created_at: string;
  last_activity_at: string | null;
}

export interface Lead {
  id: string;
  contact: string;
  contact_detail?: Contact;
  company: string | null;
  company_name?: string;
  source: string;
  status: string;
  owner: string | null;
  owner_name?: string;
  score: number;
  tags: Tag[];
  notes?: string;
  next_follow_up_at: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  name: string;
  pipeline: string;
  pipeline_name?: string;
  stage: string;
  stage_name?: string;
  contact: string | null;
  contact_name?: string;
  company: string | null;
  company_name?: string;
  amount: string | number;
  currency: string;
  probability: number;
  owner: string | null;
  owner_name?: string;
  tags: Tag[];
  expected_close_date: string | null;
  last_activity_at: string | null;
  next_task?: { id: string; name: string; due_date: string | null } | null;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline: string;
  name: string;
  order: number;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
  deal_count?: number;
  stage_value?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  order: number;
  stages: PipelineStage[];
  total_value?: number;
}

export interface Task {
  id: string;
  name: string;
  task_type: string;
  assigned_to: string | null;
  assigned_to_name?: string;
  contact: string | null;
  contact_name?: string;
  company: string | null;
  company_name?: string;
  deal: string | null;
  deal_name?: string;
  due_date: string | null;
  priority: string;
  status: string;
  notes?: string;
  completed_at: string | null;
  is_overdue: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  actor: string | null;
  actor_name?: string;
  entity_type?: string;
  object_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body?: string;
  url?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  range: { start: string; end: string };
  stats: {
    total_contacts: number;
    new_leads: number;
    qualified_leads: number;
    open_deals: number;
    pipeline_value: number;
    won_deals: number;
    lost_deals: number;
    revenue: number;
    tasks_due_today: number;
    upcoming_meetings: number;
    email_activity: number;
    whatsapp_activity: number;
    website_visitors: number;
    conversion_rate: number;
  };
  charts: {
    leads_over_time: { date: string; count: number }[];
    deals_over_time: { date: string; count: number }[];
    revenue_over_time: { date: string; value: number }[];
    pipeline_stages: { stage: string; count: number; value: number }[];
    lead_sources: { source: string; count: number }[];
    conversion_funnel: { stage: string; count: number }[];
    sales_performance: Record<string, unknown>[];
    activity_timeline: Activity[];
  };
}
