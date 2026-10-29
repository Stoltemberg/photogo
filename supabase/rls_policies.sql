# frozen_string_literal: true

# Supabase RLS (Row Level Security) Policies
#
# Este arquivo contém as policies SQL para serem executadas no Supabase Dashboard
# após as migrações. No Supabase, RLS é configurado via SQL, não via Rails migration.
#
# Execute estes comandos no SQL Editor do Supabase Dashboard:
# https://supabase.com/dashboard/project/<project-ref>/sql

-- ─────────────────────────────────────────────────────────────
-- ENABLE RLS ON TABLES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- PROFILES POLICIES
-- ─────────────────────────────────────────────────────────────

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- PLANS POLICIES
-- ─────────────────────────────────────────────────────────────

-- Anyone can view active plans (public read)
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (active = true);

-- Admins can manage plans (via service_role bypasses RLS)
-- No policy needed for admin — service_role bypasses RLS entirely

-- ─────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS POLICIES
-- ─────────────────────────────────────────────────────────────

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (e.g., cancel)
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- INVOICES POLICIES
-- ─────────────────────────────────────────────────────────────

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- USAGE_RECORDS POLICIES
-- ─────────────────────────────────────────────────────────────

-- Users can view their own usage records
CREATE POLICY "Users can view own usage records" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage records (tracking)
CREATE POLICY "Users can insert own usage records" ON usage_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- ADMIN BYPASS (service_role)
-- ─────────────────────────────────────────────────────────────
-- No policies needed for admin — service_role key bypasses RLS entirely.
-- Admin operations use the service_role_key server-side.

-- ─────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS (optional)
-- ─────────────────────────────────────────────────────────────

-- Function to get current user's subscription
CREATE OR REPLACE FUNCTION get_current_user_subscription()
RETURNS SETOF subscriptions
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT s.* FROM subscriptions s
  WHERE s.user_id = auth.uid()
  AND s.status IN ('active', 'trialing', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = auth.uid()
    AND s.status IN ('active', 'trialing', 'past_due')
    AND s.current_period_end > now()
  );
$$;

-- Function to get user's plan
CREATE OR REPLACE FUNCTION get_user_plan()
RETURNS SETOF plans
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.* FROM plans p
  JOIN subscriptions s ON s.plan_id = p.id
  WHERE s.user_id = auth.uid()
  AND s.status IN ('active', 'trialing', 'past_due')
  AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;