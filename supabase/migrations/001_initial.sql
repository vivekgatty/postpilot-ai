-- ============================================================
-- PostPika — Supabase PostgreSQL Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLE 1: profiles
-- One row per auth user. Auto-created via trigger.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                          uuid          PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email                       text          NOT NULL,
  full_name                   text,
  avatar_url                  text,
  linkedin_url                text,
  niche                       text          NOT NULL DEFAULT 'Other',
  plan                        text          NOT NULL DEFAULT 'free',
  generations_used_this_month integer       NOT NULL DEFAULT 0,
  generations_reset_date      timestamptz   DEFAULT (date_trunc('month', now()) + interval '1 month'),
  onboarding_completed        boolean       NOT NULL DEFAULT false,
  razorpay_customer_id        text,
  razorpay_subscription_id    text,
  notification_prefs          jsonb         DEFAULT '{"weekly_ideas":true,"usage_limit":true,"monthly_reset":true}',
  created_at                  timestamptz   DEFAULT now(),
  updated_at                  timestamptz   DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile — mirrors auth.users with PostPika-specific fields.';
COMMENT ON COLUMN public.profiles.plan IS 'Subscription tier: free | pro | team';
COMMENT ON COLUMN public.profiles.generations_used_this_month IS 'AI generation counter, reset monthly.';
COMMENT ON COLUMN public.profiles.generations_reset_date IS 'When the monthly counter next resets.';


-- ============================================================
-- TABLE 2: posts
-- AI-generated or user-written LinkedIn posts.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid          NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  content           text          NOT NULL,
  title             text,
  tone              text          NOT NULL,
  niche             text,
  topic_input       text,
  status            text          NOT NULL DEFAULT 'draft',
  scheduled_for     timestamptz,
  published_at      timestamptz,
  character_count   integer,
  generation_index  integer       DEFAULT 1,
  is_favourite      boolean       DEFAULT false,
  created_at        timestamptz   DEFAULT now(),
  updated_at        timestamptz   DEFAULT now(),

  CONSTRAINT posts_status_check CHECK (status IN ('draft', 'scheduled', 'published', 'archived'))
);

COMMENT ON TABLE public.posts IS 'LinkedIn posts (drafts, scheduled, and published).';
COMMENT ON COLUMN public.posts.generation_index IS 'Which regeneration attempt this is (1 = first).';
COMMENT ON COLUMN public.posts.topic_input IS 'The original user prompt used to generate this post.';


-- ============================================================
-- TABLE 3: subscriptions
-- Razorpay subscription lifecycle events.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid    NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  razorpay_subscription_id    text    UNIQUE NOT NULL,
  razorpay_plan_id            text    NOT NULL,
  plan_name                   text    NOT NULL,
  status                      text    NOT NULL DEFAULT 'created',
  current_start               timestamptz,
  current_end                 timestamptz,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now(),

  CONSTRAINT subscriptions_status_check CHECK (
    status IN ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired')
  )
);

COMMENT ON TABLE public.subscriptions IS 'Razorpay subscription records (one active per user at most).';


-- ============================================================
-- TABLE 4: usage_logs
-- Append-only audit log for AI generation events.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  action       text        NOT NULL,
  tokens_used  integer     DEFAULT 0,
  metadata     jsonb       DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

COMMENT ON TABLE public.usage_logs IS 'Append-only log of AI actions (generate_post, generate_ideas, etc.).';


-- ============================================================
-- INDEXES
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_plan
  ON public.profiles (plan);

CREATE INDEX IF NOT EXISTS idx_profiles_generations_reset_date
  ON public.profiles (generations_reset_date)
  WHERE generations_used_this_month > 0;

-- posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id
  ON public.posts (user_id);

CREATE INDEX IF NOT EXISTS idx_posts_status
  ON public.posts (status);

CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for
  ON public.posts (scheduled_for)
  WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc
  ON public.posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_status
  ON public.posts (user_id, status);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions (status);

-- usage_logs
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id
  ON public.usage_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created
  ON public.usage_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_action
  ON public.usage_logs (action);


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- ── 1. auto-set updated_at ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at IS 'Sets updated_at = now() before any UPDATE.';


-- ── 2. auto-create profile on sign-up ──────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates a profiles row when a new auth.users row is inserted.';


-- ── 3. reset monthly generation quota ──────────────────────

CREATE OR REPLACE FUNCTION public.reset_monthly_generations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    generations_used_this_month = 0,
    generations_reset_date      = date_trunc('month', now()) + interval '1 month',
    updated_at                  = now()
  WHERE
    generations_reset_date IS NOT NULL
    AND generations_reset_date <= now();
END;
$$;

COMMENT ON FUNCTION public.reset_monthly_generations IS
  'Resets generations_used_this_month to 0 for any profile whose reset date has passed.
   Call this from a pg_cron job: SELECT cron.schedule(''monthly-gen-reset'', ''0 0 1 * *'', ''SELECT public.reset_monthly_generations()'');';


-- ── 4. auto-compute character_count on posts ───────────────

CREATE OR REPLACE FUNCTION public.handle_post_character_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.character_count = char_length(NEW.content);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_post_character_count IS 'Keeps character_count in sync with content on INSERT/UPDATE.';


-- ============================================================
-- TRIGGERS
-- ============================================================

-- profiles: updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- posts: updated_at
DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- posts: character_count
DROP TRIGGER IF EXISTS trg_posts_character_count ON public.posts;
CREATE TRIGGER trg_posts_character_count
  BEFORE INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_character_count();

-- subscriptions: updated_at
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- auth.users → profiles: auto-create on sign-up
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs    ENABLE ROW LEVEL SECURITY;


-- ── profiles ────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles: select own row"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own row"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own row"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: delete own row"  ON public.profiles;

CREATE POLICY "profiles: select own row"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own row"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own row"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: delete own row"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);


-- ── posts ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "posts: select own rows"  ON public.posts;
DROP POLICY IF EXISTS "posts: insert own rows"  ON public.posts;
DROP POLICY IF EXISTS "posts: update own rows"  ON public.posts;
DROP POLICY IF EXISTS "posts: delete own rows"  ON public.posts;

CREATE POLICY "posts: select own rows"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "posts: insert own rows"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: update own rows"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: delete own rows"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);


-- ── subscriptions ───────────────────────────────────────────

DROP POLICY IF EXISTS "subscriptions: select own rows"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: insert own rows"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: update own rows"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: delete own rows"  ON public.subscriptions;

CREATE POLICY "subscriptions: select own rows"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions: insert own rows"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions: update own rows"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions: delete own rows"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);


-- ── usage_logs ──────────────────────────────────────────────

DROP POLICY IF EXISTS "usage_logs: select own rows"  ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs: insert own rows"  ON public.usage_logs;

-- Read-only for users (append-only log — no UPDATE/DELETE from client)
CREATE POLICY "usage_logs: select own rows"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usage_logs: insert own rows"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- GRANT PERMISSIONS (service_role bypasses RLS automatically)
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.profiles, public.posts, public.subscriptions, public.usage_logs
  TO authenticated;

-- anon cannot write anything
GRANT SELECT ON public.profiles TO anon;


-- ============================================================
-- OPTIONAL: pg_cron for monthly reset
-- Uncomment after enabling the pg_cron extension in Supabase.
-- ============================================================
-- SELECT cron.schedule(
--   'postpika-monthly-gen-reset',
--   '0 0 1 * *',   -- midnight on the 1st of every month
--   'SELECT public.reset_monthly_generations();'
-- );


-- ============================================================
-- DONE
-- ============================================================
