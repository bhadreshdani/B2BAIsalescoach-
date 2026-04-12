import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Browser client (for client components)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client with service role (for API routes)
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  sessions_used: number;
  years_total: string;
  years_sales: string;
  profile_data: UserProfile | null;
  created_at: string;
}

export interface UserProfile {
  linkedin: string;
  industries: string[];
  industryOther: string;
  productCategory: string;
  customerTypes: string[];
  competitors: string[];
  industryChallenges: string;
  customerNeeds: string;
  buyingCriteria: string;
}

export interface Deal {
  id: string;
  user_id: string;
  deal_code: string;
  name: string;
  industry: string;
  status: 'active' | 'won' | 'lost' | 'stalled';
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  deal_id: string;
  challenge: string;
  diagnosis_user: string;
  diagnosis_ai: string;
  situation: string;
  context: Record<string, any>;
  reflection: Record<string, string>;
  coaching_output: CoachingOutput | null;
  created_at: string;
}

export interface CoachingOutput {
  wrong: string;
  why: string;
  steps: string[];
  script: string;
  track: string;
}

export interface Feedback {
  id: string;
  session_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface KnowledgeDoc {
  id: string;
  filename: string;
  doc_type: string;
  status: 'processing' | 'active' | 'error';
  chunk_count: number;
  uploaded_at: string;
}
