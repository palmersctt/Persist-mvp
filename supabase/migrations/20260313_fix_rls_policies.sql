-- Migration: Fix overly permissive RLS policies on users and events tables
-- Date: 2026-03-13
--
-- Previously all policies used WITH CHECK (true) / USING (true), allowing
-- any holder of the anon key to read/write all rows. This migration replaces
-- them with auth.uid()-scoped policies so only authenticated Supabase Auth
-- users can access their own rows.
--
-- Because this project uses NextAuth (not Supabase Auth), server-side API
-- routes must use a service-role client that bypasses RLS entirely.

-- ============================================================
-- 1. Drop existing permissive policies on public.users
-- ============================================================
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Allow user updates" ON public.users;

-- ============================================================
-- 2. Drop existing permissive policies on public.events
-- ============================================================
DROP POLICY IF EXISTS "Allow reading events" ON public.events;
DROP POLICY IF EXISTS "Allow inserting events" ON public.events;

-- ============================================================
-- 3. Create scoped policies on public.users
-- ============================================================

-- Users can only read their own row (matched by Supabase Auth email)
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Users can only insert a row for themselves
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Users can only update their own row
CREATE POLICY "Allow user updates" ON public.users
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- ============================================================
-- 4. Create scoped policies on public.events
-- ============================================================

-- Users can only read their own events
CREATE POLICY "Allow reading events" ON public.events
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Users can only insert events attributed to themselves
CREATE POLICY "Allow inserting events" ON public.events
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);
