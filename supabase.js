// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://lllocfhavokwinjihpmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbG9jZmhhdm9rd2luamlocG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2ODIxMDgsImV4cCI6MjA2ODI1ODEwOH0.hVyZpFCAMuC57FJ7B50gM6SG7JYkTXBTaKxU3cbdKsw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 