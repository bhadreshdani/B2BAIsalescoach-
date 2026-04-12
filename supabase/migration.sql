-- ============================================
-- Bhadresh Dani AI Sales Coach — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS table (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  sessions_used INTEGER NOT NULL DEFAULT 0,
  years_total TEXT,
  years_sales TEXT,
  profile_data JSONB DEFAULT '{}',
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEALS table
-- ============================================
CREATE TABLE public.deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  deal_code TEXT NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'stalled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSIONS table (coaching sessions)
-- ============================================
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  challenge TEXT NOT NULL,
  diagnosis_user TEXT,
  diagnosis_ai TEXT,
  situation TEXT,
  context JSONB DEFAULT '{}',
  reflection JSONB DEFAULT '{}',
  coaching_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEEDBACK table
-- ============================================
CREATE TABLE public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KNOWLEDGE_DOCS table
-- ============================================
CREATE TABLE public.knowledge_docs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'Document',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'active', 'error')),
  chunk_count INTEGER DEFAULT 0,
  file_path TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_docs ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Deals: users see only their own deals
CREATE POLICY "Users can CRUD own deals" ON public.deals
  FOR ALL USING (auth.uid() = user_id);

-- Sessions: users see only their own sessions
CREATE POLICY "Users can CRUD own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);

-- Feedback: users can create/read own feedback
CREATE POLICY "Users can CRUD own feedback" ON public.feedback
  FOR ALL USING (auth.uid() = user_id);

-- Knowledge docs: readable by all authenticated users
CREATE POLICY "Authenticated users can read docs" ON public.knowledge_docs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies (for service role key — used in API routes)
-- Service role key bypasses RLS automatically

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_deals_user ON public.deals(user_id);
CREATE INDEX idx_sessions_deal ON public.sessions(deal_id);
CREATE INDEX idx_sessions_user ON public.sessions(user_id);
CREATE INDEX idx_feedback_session ON public.feedback(session_id);
CREATE INDEX idx_feedback_user ON public.feedback(user_id);

-- ============================================
-- Function to auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Monthly session reset function (run via cron)
-- ============================================
CREATE OR REPLACE FUNCTION public.reset_monthly_sessions()
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET sessions_used = 0 WHERE plan = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
