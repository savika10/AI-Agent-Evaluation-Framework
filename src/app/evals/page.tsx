import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

const ITEMS_PER_PAGE = 20;

interface SearchParams {
  page?: string;
}

async function fetchEvaluations(userId: string, page: number) {
  const supabase = createSupabaseServerClient();
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const query = (await supabase)
    .from('evaluations')
    .select('id, interaction_id, score, latency_ms, flags, created_at, pii_tokens_redacted', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data, count, error } = await query;

  if (error) console.error("Evaluation List Fetch Error:", error);

  return { data: data || [], count: count || 0 };
}

export default async function EvaluationsListPage({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams> 
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await (await supabase).auth.getUser(); 

  if (!user) return <div className="p-8">Not authenticated.</div>; 

  const { data: evals, count } = await fetchEvaluations(user.id, currentPage);
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Evaluation Drill-Down ({count} Total)</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interaction ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency (ms)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {evals.map((e) => (
              <tr key={e.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.interaction_id.substring(0, 8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(e.score * 100).toFixed(0)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.latency_ms}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/evals/${e.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Link 
          href={`/evals?page=${currentPage > 1 ? currentPage - 1 : 1}`} 
          className={`px-4 py-2 border rounded ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-100'}`}
        >
          Previous
        </Link>
        <span>Page {currentPage} of {totalPages}</span>
        <Link 
          href={`/evals?page=${currentPage < totalPages ? currentPage + 1 : totalPages}`} 
          className={`px-4 py-2 border rounded ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-100'}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}