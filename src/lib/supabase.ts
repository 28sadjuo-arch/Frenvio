import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type User = {
  id: string;
  email: string;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  avatar_color: string;
  online_status: boolean;
  last_seen: string;
  theme: string;
  location: string;
  interests: string[];
  created_at: string;
  updated_at: string;
};

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  room_id: string | null;
  receiver_id: string | null;
  content: string;
  file_url: string | null;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  room_type: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  rating: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};
