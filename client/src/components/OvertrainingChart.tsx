import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area,
} from 'recharts';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface DayLoad {
  date: Date;
  km: number;
}

interface ACWRPoint {
  dateLabel: string;
  acwr: number;
  acute: number;
  chronic: number;
}

function buildDayLoads(activities: Activity[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of activities) {
    const key = a.date.slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + a.distanceKm);
  }
  return map;
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeACWR(activities: Activity[]): ACWRPoint[] {
  if (activities.length === 0) return [];

  const kmByDay = buildDayLoads(activities);

  // Build a continuous array of the last 120 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: DayLoad[] = [];
  for (let i = 119; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ date: d, km: kmByDay.get(toKey(d)) ?? 0 });
  }

  const points: ACWRPoint[] = [];

  for (let i = 27; i < days.length; i++) {
    // Acute: sum of last 7 days
    const acute = days.slice(i - 6, i + 1).reduce((s, d) => s + d.km, 0);
    // Chronic: average of last 4 weeks (28 days)
    const chronic28 = days.slice(i - 27, i + 1).reduce((s, d) => s + d.km, 0);
    const chronic = chronic28 / 4; // convert to weekly average

    const acwr = chronic > 0 ? parseFloat((acute / chronic).toFixed(2)) : 0;

    const day = days[i];
    if (!day) continue;

    points.push({
      dateLabel: day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      acwr,
      acute: parseFloat(acute.toFixed(1)),
      chronic: parseFloat(chronic.toFixed(1)),
    });
  }

  return points;
}

function getRiskLevel(acwr: number): { label: string; color: string; bg: string } {
  if (acwr === 0) return { label: 'Sem dados', color: '#888', bg: '#1a1a1a' };
  if (acwr < 0.8) return { label: 'Volume baixo', color: '#60a5fa', bg: '#1e2a3a' };
  if (acwr <= 1.3) return { label: 'Zona segura', color: '#34d399', bg: '#1a2e26' };
  if (acwr <= 1.5) return { label: 'Atenção', color: '#fbbf24', bg: '#2e2510' };
  return { label: 'Risco alto', color: '#f87171', bg: '#2e1a1a' };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ACWRPoint }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const risk = getRiskLevel(d.acwr);
  return (
    <div style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#aaa', marginBottom: 6 }}>{label}</p>
      <p style={{ color: risk.color, fontWeight: 700 }}>ACWR: {d.acwr} — {risk.label}</p>
      <p style={{ color: '#fc4c02', marginTop: 4 }}>Carga aguda (7d): {d.acute} km</p>
      <p style={{ color: '#888' }}>Carga crônica (28d avg): {d.chronic} km/sem</p>
    </div>
  );
}

export function OvertrainingChart({ activities }: Props) {
  const data = computeACWR(activities);

  if (data.length === 0) {
    return (
      <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
        <h2>Detecção de Overtraining</h2>
        <p className="chart-empty">Dados insuficientes.</p>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const current = latest?.acwr ?? 0;
  const risk = getRiskLevel(current);

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <div className="overtraining-header">
        <div>
          <h2>Detecção de Overtraining — ACWR</h2>
          <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Razão entre carga aguda (7 dias) e crônica (média das últimas 4 semanas)
          </p>
        </div>
        <div className="acwr-badge" style={{ background: risk.bg, borderColor: risk.color }}>
          <span className="acwr-value" style={{ color: risk.color }}>{current}</span>
          <span className="acwr-label" style={{ color: risk.color }}>{risk.label}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="acwrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fc4c02" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#fc4c02" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            domain={[0, 2.2]}
            tick={{ fontSize: 11 }}
            width={36}
            ticks={[0, 0.8, 1.0, 1.3, 1.5, 2.0]}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Zone bands via reference lines */}
          <ReferenceLine y={1.5} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: '1.5 — Risco', fill: '#f87171', fontSize: 11, position: 'insideTopRight' }} />
          <ReferenceLine y={1.3} stroke="#fbbf24" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: '1.3 — Atenção', fill: '#fbbf24', fontSize: 11, position: 'insideTopRight' }} />
          <ReferenceLine y={0.8} stroke="#60a5fa" strokeDasharray="4 3" strokeWidth={1} label={{ value: '0.8', fill: '#60a5fa', fontSize: 10, position: 'insideTopRight' }} />

          <Area
            type="monotone"
            dataKey="acwr"
            stroke="none"
            fill="url(#acwrGradient)"
          />
          <Line
            type="monotone"
            dataKey="acwr"
            stroke="#fc4c02"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="acwr-zones">
        <span style={{ color: '#60a5fa' }}>● &lt; 0.8 Volume baixo</span>
        <span style={{ color: '#34d399' }}>● 0.8–1.3 Zona segura</span>
        <span style={{ color: '#fbbf24' }}>● 1.3–1.5 Atenção</span>
        <span style={{ color: '#f87171' }}>● &gt; 1.5 Risco alto</span>
      </div>
    </div>
  );
}
