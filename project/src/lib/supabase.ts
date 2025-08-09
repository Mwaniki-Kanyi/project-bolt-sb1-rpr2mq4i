import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Report {
  id: string;
  user_id?: string;
  animal_type: string;
  image_url: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'invalid' | 'updated' | 'ranger_assigned';
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  user_type: 'community' | 'ranger' | 'admin';
  created_at: string;
}