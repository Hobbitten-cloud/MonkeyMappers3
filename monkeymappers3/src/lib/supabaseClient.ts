import { createClient } from '@supabase/supabase-js';

// For Vite projects:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// For Create React App (CRA) projects:
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);