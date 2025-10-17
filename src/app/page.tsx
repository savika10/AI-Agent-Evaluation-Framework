'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    // 1. Check current session status
    supabaseClient.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      // 2. If session exists, immediately redirect to dashboard
      if (currentSession) {
        router.push('/dashboard');
      }
    });

    // 3. Listen for session changes (e.g., after login/logout)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
            router.push('/dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // If we are still loading the session (undefined), show a loading state
  if (session === undefined) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <p>Loading session...</p> 
          </div>
      );
  }

  // If session exists (shouldn't reach here due to redirect, but just in case)
  if (session) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <p>Redirecting to dashboard...</p> 
          </div>
      );
  }

  // If no session (session === null), show the landing page
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl text-gray-600 dark: text-gray-400 font-bold mb-4">AI Agent Evaluation Framework</h1>
      <p className="text-lg text-gray-600 dark: text-gray-400 mb-8">
        Measure accuracy, speed, and safety of your AI agents.
      </p>
      
      <div className="space-x-4">
        <Link 
          href="/login" 
          className="rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Get Started / Sign In
        </Link>
      </div>
    </div>
  );
}