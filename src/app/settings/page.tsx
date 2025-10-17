import { createSupabaseServerClient } from '@/lib/supabase/server';
import ConfigForm from './config-form';

export const dynamic = 'force-dynamic';

// Fetch the user's config data on the server
async function getEvaluationConfig() {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) return null; // Should be handled by middleware, but good practice

  const { data, error } = await (await supabase)
    .from('evaluation_configs')
    .select('*')
    .eq('user_id', user.id)
    .single();
    // PGRST116 is 'no rows found'
  if (error && error.code !== 'PGRST116') { 
      console.error("Error fetching config:", error);
  }

  return data;
}

export default async function SettingsPage() {
  const initialConfig = await getEvaluationConfig();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Evaluation Settings</h1>
      <p className="text-gray-600 mb-8">
        Configure how your AI agent&apos;s performance evaluations are run and stored.
      </p>
      <ConfigForm initialConfig={initialConfig} />
    </div>
  );
}