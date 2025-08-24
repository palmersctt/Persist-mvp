import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pcsmlicyvuztxxzhenru.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjc21saWN5dnV6dHh4emhlbnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5OTMwODcsImV4cCI6MjA3MTU2OTA4N30.ScUyDT-1Ns8NHlJhcl9QFRJIxeYtGnk4gvqMhzxOQ7Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)