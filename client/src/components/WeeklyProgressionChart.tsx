import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface WeekPoint {
  week: string;
  ts: number;
  km: number;
  safe: number | null;   // 110% of previous week
  over: boolean;         // exceeded 10% rule
}

function getMondayTs(date: Date): { label: string; ts: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return {
    label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    ts: d.getTime(),
  };
}

export function WeeklyProgressionChart({ activities }: Props) {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sorted.length === 0) return null;

  // Bucket by week
  const buckets = new Map<number, { label: string; km: number }>();
  const firstActivityDate = new Date(sorted[0].date);
  const firstMondayTs = getMondayTs(firstActivityDate).ts;

  for (const a of sorted) {
    const { label, ts } = getMondayTs(new Date(a.date));
    const entry = buckets.get(ts) ?? { label, km: 0 };
    entry.km += a.distanceKm;
    buckets.set(ts, entry);
  }

  const weeks = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .filter(([ts]) => ts !== firstMondayTs || firstActivityDate.getDay() === 1)
    .slice(-26);

  if (weeks.length < 2) {
    return (
      <div className="chart-card">
        <h2>Progressão Semanal</h2>
        <p className="chart-empty">Mínimo 2 semanas de dados para exibir progressão.</p>
      </div>
    );
  }

  const data: WeekPoint[] = weeks.map(([ts, { label, km }], i) => {
    const prevKm = i > 0 ? weeks[i - 1]![1].km : null;
    const safe = prevKm !== null ? parseFloat((prevKm * 1.1).toFixed(1)) : null;
    const over = safe !== null && km > safe;
    return { week: label, ts, km: parseFloat(km.toFixed(1)), safe, over };
  });

  const overweeks = data.filter((d) => d.over).length;

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2>Progressão de Volume Semanal</h2>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Linha vermelha = limite seguro (+10% da semana anterior)
          </p>
        </div>
        {overweeks > 0 && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: '#2e1a1a', border: '1px solid #7f2d2d',
            fontSize: 12, color: '#f87171', flexShrink: 0,
          }}>
            ⚠ {overweeks} semana{overweeks > 1 ? 's' : ''} acima do limite
          </div>
        )}
        {overweeks === 0 && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: '#0f2e1a', border: '1px solid #166534',
            fontSize: 12, color: '#34d399', flexShrink: 0,
          }}>
            ✓ Progressão segura
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis tick={{ fontSize: 11 }} width={40} unit=" km" />
          <Tooltip
            contentStyle={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 6 }}
            labelStyle={{ color: '#f0f0f0', fontWeight: 600 }}
            itemStyle={{ color: '#ccc' }}
            formatter={(value: number, name: string) => {
              if (name === 'km') return [`${value} km`, 'Volume real'];
              if (name === 'safe') return [`${value} km`, 'Limite +10%'];
              return [value, name];
            }}
          />
          <Legend
            formatter={(v) => v === 'km' ? 'Volume semanal' : 'Limite seguro (+10%)'}
          />

          {/* Safe zone area below the limit line */}
          <Area
            type="monotone"
            dataKey="safe"
            name="safe"
            fill="#34d399"
            fillOpacity={0.05}
            stroke="#34d399"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />

          {/* Actual weekly volume */}
          <Line
            type="monotone"
            dataKey="km"
            name="km"
            stroke="#fc4c02"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: WeekPoint };
              return (
                <circle
                  key={payload.week}
                  cx={cx}
                  cy={cy}
                  r={payload.over ? 5 : 3}
                  fill={payload.over ? '#f87171' : '#fc4c02'}
                  stroke={payload.over ? '#7f1d1d' : 'none'}
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
