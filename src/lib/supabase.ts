import { createClient } from '@supabase/supabase-js';

// Safe defaults to ensure deployed bundles on Vercel/Netlify never crash at module evaluation time
const defaultUrl = 'https://wgpypwqkhbnvcjaqrtqc.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHlwd3FraGJudmNqYXFydHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTIwMDAsImV4cCI6MjA4Njk2ODAwMH0.CtntmOricWIJIrRmx7MZqgnPCJ6Iel-VpsjMxUzp9wI';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

