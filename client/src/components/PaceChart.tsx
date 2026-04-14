import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface DataPoint {
  date: string;
  pace: number;
  paceFormatted: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatYAxis(value: number) {
  const m = Math.floor(value);
  const s = Math.round((value - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PaceChart({ activities }: Props) {
  const data: DataPoint[] = [...activities]
    .filter((a) => a.distanceKm >= 1)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((a) => ({
      date: formatDate(a.date),
      pace: parseFloat(a.paceMinKm.toFixed(2)),
      paceFormatted: a.paceFormatted,
    }));

  return (
    <div className="chart-card">
      <h2>Evolução do Pace</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tickFormatter={formatYAxis}
            domain={['auto', 'auto']}
            reversed
            tick={{ fontSize: 11 }}
            width={42}
          />
          <Tooltip
            formatter={(_value: number, _name: string, props) => {
              const point = props.payload as DataPoint | undefined;
              return [point?.paceFormatted ?? '', 'Pace'];
            }}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#fc4c02"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
