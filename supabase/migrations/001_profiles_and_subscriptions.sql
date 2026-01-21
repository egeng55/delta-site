-- Delta Database Schema: Profiles and Subscriptions
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- Stores user metadata linked to auth.users
-- Automatically created on signup via trigger

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  username TEXT UNIQUE,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'other')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can manage all profiles (for admin operations)
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- SUBSCRIPTIONS TABLE
-- =============================================================================
-- Tracks subscription status for access control

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trialing')),
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'ios', 'android', 'manual')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can modify subscriptions (payments go through backend)
CREATE POLICY "Service role has full access to subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- TRIGGER: Auto-create profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
  user_username TEXT;
  user_age INTEGER;
  user_gender TEXT;
BEGIN
  user_email := LOWER(NEW.email);
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(user_email, '@', 1));
  user_username := NEW.raw_user_meta_data->>'username'; -- User-provided username (required)
  user_age := (NEW.raw_user_meta_data->>'age')::INTEGER;
  user_gender := NEW.raw_user_meta_data->>'gender';

  -- Assign developer role to specific emails
  IF user_email IN ('egeng@umich.edu', 'eric@egeng.co') THEN
    user_role := 'developer';
  ELSE
    user_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, email, name, username, age, gender, role)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    user_username,
    user_age,
    user_gender,
    user_role
  );

  -- Create free subscription for new users
  INSERT INTO public.subscriptions (user_id, plan, status, source)
  VALUES (NEW.id, 'free', 'active', 'web');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- TRIGGER: Update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- =============================================================================
-- GRANT DEVELOPER ACCESS TO EXISTING USERS
-- =============================================================================
-- Run this to update existing users with developer emails

UPDATE public.profiles
SET role = 'developer'
WHERE email IN ('egeng@umich.edu', 'eric@egeng.co');

-- =============================================================================
-- VIEW: User access (combines profile + subscription for easy access checks)
-- =============================================================================

CREATE OR REPLACE VIEW public.user_access AS
SELECT
  p.id,
  p.email,
  p.name,
  p.username,
  p.age,
  p.gender,
  p.role,
  s.plan,
  s.status,
  s.current_period_end,
  CASE
    WHEN p.role IN ('developer', 'admin') THEN TRUE
    WHEN s.status = 'active' AND s.plan != 'free' AND s.current_period_end > NOW() THEN TRUE
    ELSE FALSE
  END AS has_premium_access
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.user_access TO authenticated;

-- =============================================================================
-- MENSTRUAL CYCLE TRACKING
-- =============================================================================

-- Menstrual cycle logs - stores individual period and cycle events
CREATE TABLE IF NOT EXISTS public.menstrual_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('period_start', 'period_end', 'ovulation', 'fertile_start', 'fertile_end', 'symptom')),
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy', 'spotting')),
  symptoms TEXT[], -- Array of symptoms: cramps, headache, bloating, mood_changes, fatigue, etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date, event_type)
);

-- User menstrual preferences and settings
CREATE TABLE IF NOT EXISTS public.menstrual_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tracking_enabled BOOLEAN NOT NULL DEFAULT false,
  average_cycle_length INTEGER DEFAULT 28,
  average_period_length INTEGER DEFAULT 5,
  last_period_start DATE,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.menstrual_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menstrual_settings ENABLE ROW LEVEL SECURITY;

-- Policies for menstrual_logs
CREATE POLICY "Users can view own menstrual logs"
  ON public.menstrual_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menstrual logs"
  ON public.menstrual_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menstrual logs"
  ON public.menstrual_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own menstrual logs"
  ON public.menstrual_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for menstrual_settings
CREATE POLICY "Users can view own menstrual settings"
  ON public.menstrual_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menstrual settings"
  ON public.menstrual_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menstrual settings"
  ON public.menstrual_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for menstrual tracking
CREATE INDEX IF NOT EXISTS idx_menstrual_logs_user_id ON public.menstrual_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_menstrual_logs_date ON public.menstrual_logs(date);
CREATE INDEX IF NOT EXISTS idx_menstrual_logs_user_date ON public.menstrual_logs(user_id, date);
