-- Create users table for signup tracking
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  image text,
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_login_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create index on created_at for analytics queries
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row (matched by Supabase Auth email)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Users can only insert a row for themselves
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Users can only update their own row
CREATE POLICY "Allow user updates" ON users
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- ============================================================
-- Events table for user engagement tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('card_swipe', 'metric_click', 'card_share')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS events_user_email_idx ON events(user_email);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own events
CREATE POLICY "Allow reading events" ON events
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Users can only insert events attributed to themselves
CREATE POLICY "Allow inserting events" ON events
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);