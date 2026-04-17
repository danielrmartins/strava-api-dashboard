import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

// ACSM submaximal HR-based VO2 Max estimate
// VO2max = (0.2 × speed_m_per_min + 3.5) × (HRmax / HRavg)
// Much more accurate than pace-only formulas when HR data is available
function estimateVO2Max(
  distanceKm: number,
  durationMin: number,
  avgHR: number,
  globalMaxHR: number
): number | null {
  if (durationMin < 10 || distanceKm < 1.5) return null;
  if (avgHR <= 0 || globalMaxHR <= 0 || avgHR >= globalMaxHR) return null;

  const speedMPerMin = (distanceKm * 1000) / durationMin;
  const vo2Submax = 0.2 * speedMPerMin + 3.5;
  const result = vo2Submax * (globalMaxHR / avgHR);

  if (result < 20 || result > 90) return null;
  return Math.round(result * 10) / 10;
}

// 28-day rolling average
function rollingAvg(
  points: { date: string; vo2: number }[],
  windowDays = 28
): (number | null)[] {
  return points.map((p, i) => {
    const cutoff = new Date(p.date);
    cutoff.setDate(cutoff.getDate() - windowDays);
    const window = points
      .slice(0, i + 1)
      .filter((q) => new Date(q.date) >= cutoff);
    if (window.length === 0) return null;
    return Math.round((window.reduce((s, q) => s + q.vo2, 0) / window.length) * 10) / 10;
  });
}

interface DataPoint {
  date: string;
  label: string;
  vo2: number | null;
  avg: number | null;
}

// VO2 Max fitness categories (ml/kg/min) — general adult reference
const ZONES = [
  { value: 55, label: 'Excelente', color: '#34d399' },
  { value: 45, label: 'Bom', color: '#60a5fa' },
  { value: 35, label: 'Regular', color: '#fbbf24' },
];

export function VO2MaxChart({ activities }: Props) {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Use highest maxHeartRate across all activities as HRmax reference
  const globalMaxHR = Math.max(
    ...sorted.map((a) => a.maxHeartRate ?? 0).filter((v) => v > 0)
  );

  const withVO2 = sorted
    .map((a) => ({
      date: a.date,
      vo2: a.avgHeartRate
        ? estimateVO2Max(a.distanceKm, a.durationMin, a.avgHeartRate, globalMaxHR)
        : null,
    }))
    .filter((p): p is { date: string; vo2: number } => p.vo2 !== null);

  if (withVO2.length < 5) {
    return (
      <div className="chart-card">
        <h2>VO₂ Máx Estimado</h2>
        <p className="chart-empty">Dados insuficientes (mínimo 5 corridas ≥ 10 min com frequência cardíaca).</p>
      </div>
    );
  }

  const avgs = rollingAvg(withVO2);

  const data: DataPoint[] = withVO2.map((p, i) => ({
    date: p.date,
    label: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    vo2: p.vo2,
    avg: avgs[i] ?? null,
  }));

  const allVals = withVO2.map((p) => p.vo2);
  const minVal = Math.floor(Math.min(...allVals) - 2);
  const maxVal = Math.ceil(Math.max(...allVals) + 2);

  const latest = avgs[avgs.length - 1];
  const first = avgs.find((v) => v !== null);
  const trend =
    latest !== null && first !== null && latest !== undefined && first !== undefined
      ? latest - first
      : null;

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2>VO₂ Máx Estimado</h2>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Estimativa via ACSM (pace + frequência cardíaca)
          </p>
        </div>
        {latest !== null && latest !== undefined && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 18px', borderRadius: 10, border: '1px solid #2a2a2a',
            background: '#1a1a1a', flexShrink: 0,
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: '#f0f0f0' }}>
              {latest.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ml/kg/min
            </span>
            {trend !== null && (
              <span style={{ fontSize: 11, marginTop: 4, color: trend >= 0 ? '#34d399' : '#f87171' }}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)} vs início
              </span>
            )}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontSize: 11 }}
            width={36}
            unit=""
          />
          <Tooltip
            contentStyle={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 6 }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} ml/kg/min`,
              name === 'avg' ? 'Média 28 dias' : 'Corrida',
            ]}
            labelFormatter={(label: string) => label}
          />
          <Legend formatter={(v) => (v === 'avg' ? 'Média 28 dias' : 'Por corrida')} />

          {ZONES.map((z) => (
            <ReferenceLine
              key={z.value}
              y={z.value}
              stroke={z.color}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: z.label, position: 'insideTopRight', fontSize: 10, fill: z.color }}
            />
          ))}

          <Line
            type="monotone"
            dataKey="vo2"
            name="vo2"
            stroke="#fc4c02"
            strokeWidth={0}
            dot={{ r: 2, fill: '#fc4c02', opacity: 0.5 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="avg"
            name="avg"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#555', flexWrap: 'wrap' }}>
        {ZONES.map((z) => (
          <span key={z.value} style={{ color: z.color }}>
            {`≥ ${z.value} ${z.label}`}
          </span>
        ))}
      </div>
    </div>
  );
}
