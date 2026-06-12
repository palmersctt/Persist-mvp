-- Migration: Wearable connections + daily actuals
-- Date: 2026-06-11
--
-- Two tables behind the forecast-vs-actual merge:
--   wearable_connections — one OAuth connection per user per provider
--     (WHOOP today, demo provider for users without a device). Holds tokens,
--     so it is service-role only: RLS enabled with NO anon policies.
--   wearable_daily — one row per user per local calendar day of normalized
--     physiological actuals (recovery, sleep, HRV, RHR, day strain). Written
--     server-side by /api/wearables/actuals; read back for the dashboard.

CREATE TABLE IF NOT EXISTS public.wearable_connections (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email text NOT NULL,
  provider text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, provider)
);

-- Tokens live here — no client access at all. API routes use the
-- service-role client, which bypasses RLS.
ALTER TABLE public.wearable_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.wearable_daily (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email text NOT NULL,
  date date NOT NULL,
  provider text NOT NULL,
  recovery integer,
  sleep_hours numeric(4,1),
  sleep_performance integer,
  hrv_ms integer,
  resting_hr integer,
  day_strain numeric(4,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, date)
);

ALTER TABLE public.wearable_daily ENABLE ROW LEVEL SECURITY;

-- Same hardening as daily_scores: the anon key gets read-own only.
CREATE POLICY "Users can read own wearable days" ON public.wearable_daily
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);
