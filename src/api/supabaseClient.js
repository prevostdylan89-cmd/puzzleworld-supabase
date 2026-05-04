import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ghbutltffpnrdkbtvlog.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnV0bHRmZnBucmRrYnR2bG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDgzMTAsImV4cCI6MjA5MzQ4NDMxMH0.gU5V7C4-d8xAIy2nPUUr1IzwS2cS1yjyuvihbMwaJCo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

export default supabase;
