-- ============================================================
-- Migration 002: saved_hooks table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_hooks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        text NOT NULL,
  style_id       text NOT NULL,
  style_label    text NOT NULL,
  idea_input     text NOT NULL,
  niche          text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS saved_hooks_user_id_idx ON public.saved_hooks(user_id);

-- RLS
ALTER TABLE public.saved_hooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_hooks: select own rows" ON public.saved_hooks;
DROP POLICY IF EXISTS "saved_hooks: insert own rows" ON public.saved_hooks;
DROP POLICY IF EXISTS "saved_hooks: delete own rows" ON public.saved_hooks;

CREATE POLICY "saved_hooks: select own rows"
  ON public.saved_hooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_hooks: insert own rows"
  ON public.saved_hooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_hooks: delete own rows"
  ON public.saved_hooks FOR DELETE
  USING (auth.uid() = user_id);

-- Permissions
GRANT SELECT, INSERT, DELETE ON public.saved_hooks TO authenticated;
