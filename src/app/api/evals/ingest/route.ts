import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface EvalPayload {
  interaction_id: string;
  user_id: string; 
  prompt: string;
  response: string;
  score: number;
  latency_ms: number;
  flags?: string[];
  pii_tokens_redacted?: number;
  created_at?: string; 
}

// Use a custom secret for API security 
const INGESTION_SECRET = process.env.INGESTION_API_SECRET;

export async function POST(request: Request) {
  // Secret Key Authentication (Security Check)
  const secretHeader = request.headers.get('X-Ingestion-Secret');
  if (!INGESTION_SECRET || secretHeader !== INGESTION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Ingestion Secret' }, { status: 401 });
  }

  let payload: EvalPayload;
  try {
    payload = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate essential fields
  if (!payload.user_id || !payload.interaction_id || payload.score == null) {
     return NextResponse.json({ error: 'Missing required fields: user_id, interaction_id, or score.' }, { status: 400 });
  }

  // Prepare data for insertion (map to database columns)
  const evalData = {
    user_id: payload.user_id,
    interaction_id: payload.interaction_id,
    prompt: payload.prompt,
    response: payload.response,
    score: payload.score,
    latency_ms: payload.latency_ms,
    flags: payload.flags || [],
    pii_tokens_redacted: payload.pii_tokens_redacted || 0,
    created_at: payload.created_at,
  };

  // Insert data using the Service Role Client (bypasses RLS for this high-privilege insert)
  // The RLS policy for INSERT on 'evaluations' is still checked, but the Service Role 
  // allows us to specify the user_id without relying on the current session's auth.uid().
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await (await supabase)
    .from('evaluations')
    .insert([evalData])
    .select();

  if (error) {
    console.error('Supabase Insertion Error:', error);
    return NextResponse.json({ error: 'Database insertion failed', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'success', id: data[0].id }, { status: 201 });
}