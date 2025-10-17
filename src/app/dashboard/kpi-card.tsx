interface KpiCardProps {
  title: string;
  value: string;
  subtext: string;
}

export default function KpiCard({ title, value, subtext }: KpiCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{subtext}</p>
    </div>
  );
}