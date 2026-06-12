import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivnrhfwxmpicpfqgoimd.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bnJoZnd4bXBpY3BmcWdvaW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDUxMzIsImV4cCI6MjA4Nzc4MTEzMn0.5p3WptNjgcZJd5N1MIPIh1dULNSgoGst5_LMEu4KH0c';

// Public client — subject to RLS policies (use for client-side code only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client — bypasses RLS (use in API routes only)
// Requires SUPABASE_SERVICE_ROLE_KEY env var to be set
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Without the service-role key every server-side write (daily_scores,
// wearable_connections, users) is silently blocked by RLS — make the
// misconfiguration loud and checkable.
export const isServiceRoleConfigured = !!supabaseServiceRoleKey;
if (!supabaseServiceRoleKey && typeof window === 'undefined') {
  console.warn(
    '[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the anon client. ' +
      'Server-side writes (daily_scores, wearable_connections) WILL FAIL with 401s.'
  );
}

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : supabase; // Fallback to anon client if service role key is not configured
