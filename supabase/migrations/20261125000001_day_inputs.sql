-- Migration: per-day model inputs (the readiness engine's history)
-- Date: 2026-11-25
--
-- One row per user per local calendar day: the numbers the readiness model
-- scored that day (src/lib/model.ts DayInputs). Read back as history so the
-- verdict is measured against the user's own baseline. Numbers only — no
-- titles, attendees or content. Written server-side by /api/day-inputs (and,
-- later, the assistant MCP route) through the service-role client.

CREATE TABLE IF NOT EXISTS public.day_inputs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email text NOT NULL,
  date date NOT NULL,
  work_load real NOT NULL,
  work_index real NOT NULL,
  training_load real NOT NULL,
  training_feel real NOT NULL DEFAULT 0,
  sleep real NOT NULL,
  engine_version smallint NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'dashboard' CHECK (source IN ('dashboard', 'assistant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, date)
);

ALTER TABLE public.day_inputs ENABLE ROW LEVEL SECURITY;

-- NextAuth (not Supabase Auth) signs users in, so API routes use the
-- service-role client. The anon key gets read-own only, as for daily_scores.
DROP POLICY IF EXISTS "Users can read own day inputs" ON public.day_inputs;
CREATE POLICY "Users can read own day inputs" ON public.day_inputs
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);
