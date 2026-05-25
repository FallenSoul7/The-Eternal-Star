import { createClient } from '@supabase/supabase-js';

// We force TypeScript to treat these as strings so the build doesn't fail
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// A clear error message just in case Vercel loses track of the keys
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your Vercel Environment Settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
