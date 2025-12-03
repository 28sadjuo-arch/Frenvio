import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username?: string
  bio?: string
  verified: boolean
  followers_count: number
  following_count: number
}

export type Post = {
  id: string
  user_id: string
  content: string
  likes: number
  reposts: number
  created_at: string
}