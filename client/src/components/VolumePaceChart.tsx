import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface WeekPoint {
  week: string;
  weekDate: number;
  km: number;
  pace: number;
  paceFormatted: string;
}

function getMondayKey(date: Date): { label: string; ts: number } {
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

function formatPace(pace: number): string {
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

function buildData(activities: Activity[]): WeekPoint[] {
  const map = new Map<number, { label: string; totalKm: number; totalMin: number }>();

  // Find the Monday of the earliest activity to detect partial first week
  const sorted = [...activities].filter((a) => a.distanceKm >= 1)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) return [];

  const firstActivityDate = new Date(sorted[0].date);
  const firstMondayTs = getMondayKey(firstActivityDate).ts;

  for (const a of sorted) {
    const { label, ts } = getMondayKey(new Date(a.date));
    const entry = map.get(ts) ?? { label, totalKm: 0, totalMin: 0 };
    entry.totalKm += a.distanceKm;
    entry.totalMin += a.durationMin;
    map.set(ts, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    // Remove first week if activities started mid-week (partial week)
    .filter(([ts]) => {
      if (ts !== firstMondayTs) return true;
      // Keep it only if the first activity falls exactly on Monday
      return firstActivityDate.getDay() === 1;
    })
    .slice(-26)
    .map(([ts, { label, totalKm, totalMin }]) => {
      const km = parseFloat(totalKm.toFixed(1));
      const pace = totalKm > 0 ? parseFloat((totalMin / totalKm).toFixed(4)) : 0;
      return { week: label, weekDate: ts, km, pace, paceFormatted: formatPace(pace) };
    });
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: WeekPoint;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const km = payload.find((p) => p.name === 'Volume');
  const paceEntry = payload.find((p) => p.name === 'Pace');
  const paceFormatted = paceEntry?.payload.paceFormatted ?? '';

  return (
    <div style={{
      background: '#222',
      border: '1px solid #2a2a2a',
      borderRadius: 6,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <p style={{ marginBottom: 6, color: '#aaa' }}>Semana de {label}</p>
      {km && <p style={{ color: '#fc4c02' }}>Volume: {km.value} km</p>}
      {paceEntry && <p style={{ color: '#60a5fa' }}>Pace médio: {paceFormatted}</p>}
    </div>
  );
}

function formatPaceAxis(value: number) {
  const m = Math.floor(value);
  const s = Math.round((value - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VolumePaceChart({ activities }: Props) {
  const data = buildData(activities);

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <h2>Volume vs Pace Semanal</h2>
      <p style={{ fontSize: 12, color: '#888', marginTop: -8 }}>
        Correlação entre quilometragem semanal e pace médio
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} interval="preserveStartEnd" />

          {/* Left Y: volume in km */}
          <YAxis
            yAxisId="km"
            orientation="left"
            tick={{ fontSize: 11 }}
            width={40}
            unit=" km"
          />

          {/* Right Y: pace in min/km (reversed so faster = higher) */}
          <YAxis
            yAxisId="pace"
            orientation="right"
            tickFormatter={formatPaceAxis}
            domain={['auto', 'auto']}
            reversed
            tick={{ fontSize: 11 }}
            width={44}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Bar
            yAxisId="km"
            dataKey="km"
            name="Volume"
            fill="#fc4c02"
            opacity={0.75}
            radius={[3, 3, 0, 0]}
          />
          <Line
            yAxisId="pace"
            type="monotone"
            dataKey="pace"
            name="Pace"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ r: 3, fill: '#60a5fa' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
