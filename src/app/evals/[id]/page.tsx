import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface DetailPageProps {
    params: Promise<{ id: string }>;
}

// Function to simulate PII masking
const maskText = (text: string) => {
    // A simple masking logic: replace vowels and common sensitive patterns with X
    return text.replace(/[aeiouAEIOU]/g, 'X').replace(/\b\d{4}\b/g, 'XXXX');
};

async function fetchEvalDetail(evalId: string, userId: string) {
    const supabase = await createSupabaseServerClient();

    // Fetch the specific evaluation
    const { data: evalDetail, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', evalId)
        .eq('user_id', userId) 
        .single();

    // Fetch the user's config to check the PII flag
    const { data: config, error: configError } = await supabase
        .from('evaluation_configs')
        .select('obfuscate_pii')
        .eq('user_id', userId)
        .single();

    if (evalError) console.error("Eval Detail Fetch Error:", evalError);
    if (configError) console.error("Config Fetch Error:", configError);

    return { evalDetail, obfuscatePii: config?.obfuscate_pii || false };
}

export default async function EvaluationDetailPage({ params }: DetailPageProps) {
    const { id } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div className="p-8">Not authenticated.</div>; 

    const { evalDetail, obfuscatePii } = await fetchEvalDetail(id, user.id);

    if (!evalDetail) {
        return <div className="p-8">Evaluation record not found or access denied.</div>;
    }

    const maskedPrompt = obfuscatePii ? maskText(evalDetail.prompt) : evalDetail.prompt;
    const maskedResponse = obfuscatePii ? maskText(evalDetail.response) : evalDetail.response;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Link href="/evals" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">&larr; Back to List</Link>
            <h1 className="text-3xl font-bold mb-6">Evaluation Detail: {evalDetail.interaction_id.substring(0, 12)}</h1>

            <div className="bg-white shadow p-6 rounded-lg space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Score:</strong> {(evalDetail.score * 100).toFixed(1)}%</p>
                    <p><strong>Latency:</strong> {evalDetail.latency_ms} ms</p>
                    <p><strong>Redacted Tokens:</strong> {evalDetail.pii_tokens_redacted}</p>
                    <p><strong>Flags:</strong> {evalDetail.flags.join(', ') || 'None'}</p>
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-3">Agent Prompt {obfuscatePii && <span className="text-red-500 text-sm">(PII Masking Active)</span>}</h2>
                    <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">{maskedPrompt}</pre>
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-3">Agent Response</h2>
                    <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">{maskedResponse}</pre>
                </div>
            </div>
        </div>
    );
}