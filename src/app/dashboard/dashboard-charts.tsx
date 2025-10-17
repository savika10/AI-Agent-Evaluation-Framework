'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  avg_score: number;
  avg_latency: number;
  total_redactions: number;
}

interface DashboardChartsProps {
  data: ChartDataPoint[];
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="50%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0.5, 1.0]} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="avg_score" 
                    stroke="#8884d8" 
                    name="Avg Score (0-1)"
                    strokeWidth={2}
                />
                <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="avg_latency" 
                    stroke="#82ca9d" 
                    name="Avg Latency (ms)" 
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
         <h3 className="text-lg font-medium mt-6 mb-2">Total PII Redactions</h3>
        <ResponsiveContainer width="100%" height="40%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="total_redactions" 
                    stroke="#ffc658" 
                    name="PII Tokens Redacted"
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}