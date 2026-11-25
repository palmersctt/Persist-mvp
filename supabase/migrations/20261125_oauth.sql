-- Migration: OAuth 2.1 for one-click assistant connectors (MCP)
-- Date: 2026-11-25 (apply after 20261125_api_tokens.sql)
--
-- Assistants register themselves (dynamic client registration), send the
-- user to Persist's consent page, and exchange a one-time code (PKCE) for an
-- access token, which is an api_tokens row like a personal token.

CREATE TABLE IF NOT EXISTS public.oauth_clients (
  client_id text PRIMARY KEY,
  client_name text NOT NULL,
  redirect_uris text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oauth_codes (
  code_hash text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.oauth_clients (client_id) ON DELETE CASCADE,
  user_email text NOT NULL,
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Service role only.
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_codes ENABLE ROW LEVEL SECURITY;
