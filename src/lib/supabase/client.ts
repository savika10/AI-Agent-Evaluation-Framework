import { createClient } from '@supabase/supabase-js';

// Create a singleton client for the browser/client components
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xtbouzpcmqyoheupxoof.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Ym91enBjbXF5b2hldXB4b29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTMwNjAsImV4cCI6MjA3NjEyOTA2MH0.DG4-e-GDSFPnh-AP9X0gEPEZrV_k0ia7R8Dpuj7c2gQ"
);