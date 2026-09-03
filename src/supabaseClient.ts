import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-do-supabase.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PBEbOta2UmZpvaQyBYRvYA_WOBO6PT5'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
