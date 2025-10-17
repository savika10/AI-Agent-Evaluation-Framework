import { createClient } from '@supabase/supabase-js';

// Create a singleton client for the browser/client components
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);