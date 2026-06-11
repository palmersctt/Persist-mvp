-- Migration: Daily score history for trends
-- Date: 2026-06-11
--
-- One row per user per local calendar day, holding the three internal
-- metrics (displayed as Focus/Strain/Balance). Written server-side by
-- /api/work-health through the service-role client on every score
-- computation; read back by /api/score-history for the dashboard
-- trends section.

CREATE TABLE IF NOT EXISTS public.daily_scores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email text NOT NULL,
  date date NOT NULL,
  performance integer NOT NULL,
  resilience integer NOT NULL,
  sustainability integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, date)
);

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

-- This project signs users in with NextAuth (not Supabase Auth), so API
-- routes access this table via the service-role client, which bypasses RLS.
-- The anon key gets a read-own policy only — same hardening as users/events.
CREATE POLICY "Users can read own scores" ON public.daily_scores
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);
