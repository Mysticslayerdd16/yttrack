import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxajpjxypltpqnleapis.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YWpwanh5cGx0cHFubGVhcGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDAyNzgsImV4cCI6MjA5MjE3NjI3OH0.6xNLPxcuzW42BZ3fskQHNSB7HYFqHS7tg1EJFMvrEXs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
