// Supabase client used by the whole app.
// The URL and anon key come from environment variables (see .env.example).
// The anon key is safe to ship in a public GitHub Pages site because every
// table is protected by Row Level Security (see supabase/schema.sql).
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
