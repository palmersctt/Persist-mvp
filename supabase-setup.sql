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

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true); -- For now, allow read access for analytics

-- Create policy to allow inserts (for signup tracking)
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Create policy to allow updates (for login tracking)
CREATE POLICY "Allow user updates" ON users
  FOR UPDATE USING (true);