import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    // This client reads and writes the user's session from the cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchanges the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the protected dashboard page after sign-in/sign-up
  return NextResponse.redirect(requestUrl.origin + '/dashboard');
}