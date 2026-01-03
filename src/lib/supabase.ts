import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  verified?: boolean | null
  followers_count?: number | null
  following_count?: number | null
  verification_requested?: boolean | null
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url?: string | null
  likes?: number | null
  reposts?: number | null
  created_at: string
}
