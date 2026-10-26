import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://mrtujthqbdgbidypbzsr.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydHVqdGhxYmRnYmlkeXBienNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjgyOTcsImV4cCI6MjEwMzYwNDI5N30.C4DAVrrxHCRvqrYaRx-xquKtST7jtQuBgxca4CYRxgA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
