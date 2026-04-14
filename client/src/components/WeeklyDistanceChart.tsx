import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface WeekBucket {
  week: string;
  km: number;
}

function getMondayTs(date: Date): { label: string; ts: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return {
    label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    ts: d.getTime(),
  };
}

export function WeeklyDistanceChart({ activities }: Props) {
  const buckets = new Map<number, { label: string; km: number }>();

  const sorted = [...activities].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sorted.length === 0) return null;

  const firstActivityDate = new Date(sorted[0].date);
  const firstMondayTs = getMondayTs(firstActivityDate).ts;

  for (const a of sorted) {
    const { label, ts } = getMondayTs(new Date(a.date));
    const entry = buckets.get(ts) ?? { label, km: 0 };
    entry.km += a.distanceKm;
    buckets.set(ts, entry);
  }

  const data: WeekBucket[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .filter(([ts]) => ts !== firstMondayTs || firstActivityDate.getDay() === 1)
    .slice(-26)
    .map(([, { label, km }]) => ({ week: label, km: parseFloat(km.toFixed(1)) }));

  return (
    <div className="chart-card">
      <h2>Km por Semana</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} width={36} unit=" km" />
          <Tooltip formatter={(value: number) => [`${value} km`, 'Distância']} />
          <Bar dataKey="km" fill="#fc4c02" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
