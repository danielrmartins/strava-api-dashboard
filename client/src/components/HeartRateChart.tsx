import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface DataPoint {
  date: string;
  avg: number | null;
  max: number | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function HeartRateChart({ activities }: Props) {
  const data: DataPoint[] = [...activities]
    .filter((a) => a.avgHeartRate !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((a) => ({
      date: formatDate(a.date),
      avg: a.avgHeartRate,
      max: a.maxHeartRate,
    }));

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <h2>Frequência Cardíaca</h2>
        <p className="chart-empty">Nenhuma atividade com dados de FC no período.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h2>Frequência Cardíaca</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={36} />
          <Tooltip formatter={(value: number) => [`${value} bpm`]} />
          <Legend />
          <Line
            type="monotone"
            dataKey="avg"
            name="FC Média"
            stroke="#e84393"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="max"
            name="FC Máx"
            stroke="#ff6b6b"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
