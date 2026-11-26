-- Migration: personal access tokens for assistants (MCP)
-- Date: 2026-11-25
--
-- A user creates a token on the dashboard and gives it to an assistant; the
-- assistant calls /api/mcp with it. Only a SHA-256 hash is stored; the token
-- itself is shown once. window_* hold a simple per-token hourly rate limit.

CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  label text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  window_start timestamptz,
  window_calls integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS api_tokens_user_email_idx ON public.api_tokens (user_email);

-- Service role only: no anon policies at all.
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
