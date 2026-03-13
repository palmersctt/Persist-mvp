import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ivnrhfwxmpicpfqgoimd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bnJoZnd4bXBpY3BmcWdvaW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDUxMzIsImV4cCI6MjA4Nzc4MTEzMn0.5p3WptNjgcZJd5N1MIPIh1dULNSgoGst5_LMEu4KH0c'

// Public client — subject to RLS policies (use for client-side code only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client — bypasses RLS (use in API routes only)
// Requires SUPABASE_SERVICE_ROLE_KEY env var to be set
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : supabase // Fallback to anon client if service role key is not configured