import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ivnrhfwxmpicpfqgoimd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bnJoZnd4bXBpY3BmcWdvaW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDUxMzIsImV4cCI6MjA4Nzc4MTEzMn0.5p3WptNjgcZJd5N1MIPIh1dULNSgoGst5_LMEu4KH0c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)