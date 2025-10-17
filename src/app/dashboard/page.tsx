/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import DashboardCharts from './dashboard-charts'; // Client component for visualization
import KpiCard from './kpi-card';

export const dynamic = 'force-dynamic';

// Define the date ranges for KPIs and Trends - FIXED: Use full ISO timestamps
const TODAY = new Date().toISOString();
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

// --- Data Fetching Logic (Server Component) ---
async function fetchDashboardData() {
  const supabase = await createSupabaseServiceRoleClient();
  const { data: { user } } = await supabase.auth.getUser();

  const testUserId = '476b56c5-d886-4896-a5e0-ab0b56a5b3dd';
  const userId = user?.id || testUserId;

  //  Fetch KPI Aggregations (Overall, 7-day, 30-day)
  const { data: kpiData, error: kpiError } = await supabase.rpc('get_evaluation_kpis', { 
      user_id_input: userId 
  });

  //  Fetch Trend Data (Daily Aggregation for charts)
  const { data: trendData, error: trendError } = await supabase
    .from('evaluations')
    .select('created_at, score, latency_ms, pii_tokens_redacted')
    .eq('user_id', userId)
    .gte('created_at', THIRTY_DAYS_AGO) // Now using full ISO timestamp
    .order('created_at', { ascending: true });

  // Simple processing to aggregate daily data for trends 
  type DailyAgg = {
    date: string;
    count: number;
    total_score: number;
    total_latency: number;
    total_pii: number;
  };

  const dailyData = trendData?.reduce<Record<string, DailyAgg>>((acc, row: any) => {
    const dateKey = row.created_at.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, count: 0, total_score: 0, total_latency: 0, total_pii: 0 };
    }
    acc[dateKey].count += 1;
    acc[dateKey].total_score += parseFloat(row.score);
    acc[dateKey].total_latency += row.latency_ms;
    acc[dateKey].total_pii += row.pii_tokens_redacted;
    return acc;
  }, {} as Record<string, DailyAgg>);

  const trends = dailyData ? Object.values(dailyData).map((d: any) => ({
    date: d.date,
    avg_score: d.total_score / d.count,
    avg_latency: d.total_latency / d.count,
    total_redactions: d.total_pii
  })) : [];

  return { kpis: kpiData ? kpiData[0] : null, trends };
}

export default async function DashboardPage() {
  const { kpis, trends } = await fetchDashboardData();

  if (!kpis) {
    return <div className="p-8 text-center">Loading or No Data available. Run `npm run seed` to populate data.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Agent Performance Dashboard</h1>

      {/*  KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard title="Overall Success Rate" value={`${(kpis.overall_success_rate * 100).toFixed(1)}%`} subtext="Total average score" />
        <KpiCard title="Avg Latency (30 Days)" value={`${kpis.avg_latency_30d.toFixed(0)} ms`} subtext="Trend over the last month" />
        <KpiCard title="Redactions (7 Days)" value={kpis.total_redactions_7d.toLocaleString()} subtext="PII tokens removed" />
        <KpiCard title="Success Rate (7 Days)" value={`${(kpis.avg_score_7d * 100).toFixed(1)}%`} subtext="Recent performance" />
      </div>

      {/*  Charts (Trends) */}
      <div className="space-y-10">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">30-Day Performance Trends</h2>
          <DashboardCharts data={trends ?? []} />
        </div>
      </div>
    </div>
  );
}