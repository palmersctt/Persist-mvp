-- Migration: the verdict shown and the user's own rating, per day
-- Date: 2026-11-25 (apply after 20261125_day_inputs.sql)
--
-- Adds to day_inputs what the user was shown (verdict, readiness) and how
-- the day actually felt (1–5), so calibration is one query over one table.

ALTER TABLE public.day_inputs
  ADD COLUMN IF NOT EXISTS verdict text
    CHECK (verdict IN ('Survival', 'Grinding', 'Coasting', 'Locked In', 'Flow')),
  ADD COLUMN IF NOT EXISTS readiness smallint CHECK (readiness BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS feel_rating smallint CHECK (feel_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rated_at timestamptz;
