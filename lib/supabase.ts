
import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars without crashing if objects are undefined
const getEnv = (key: string) => {
  // Check import.meta.env (Vite standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  
  // Check process.env (Node/Webpack fallback)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  return '';
};

const supabaseUrl = getEnv('###');
const supabaseAnonKey = getEnv('###');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Check your environment variables.');
}

// Create client with fallbacks to prevent initialization crash
// If keys are missing, auth calls will simply fail with an error instead of crashing the app
export const supabase = createClient(
  supabaseUrl || '###',
  supabaseAnonKey || '###'
);
