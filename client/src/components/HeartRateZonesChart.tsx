import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { Activity } from '../types';
import type { HRZone } from '../hooks/useHRZones';

interface Props {
  activities: Activity[];
  zones: HRZone[];
}

const ZONE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#ef4444'];
const ZONE_NAMES = ['Z1 — Recuperação', 'Z2 — Aeróbico', 'Z3 — Tempo', 'Z4 — Limiar', 'Z5 — VO2 Máx'];

function getZoneIndex(hr: number, zones: HRZone[]): number {
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    if (!zone) continue;
    const max = zone.max === -1 ? Infinity : zone.max;
    if (hr >= zone.min && hr < max) return i;
  }
  return zones.length - 1;
}

interface ZoneBar {
  name: string;
  corridas: number;
  minutos: number;
  color: string;
}

export function HeartRateZonesChart({ activities, zones }: Props) {
  const withHR = activities.filter((a) => a.avgHeartRate !== null);

  if (withHR.length === 0) {
    return (
      <div className="chart-card">
        <h2>Zonas de Frequência Cardíaca</h2>
        <p className="chart-empty">Nenhuma atividade com dados de FC no período.</p>
      </div>
    );
  }

  const counts = Array.from({ length: zones.length }, () => ({ corridas: 0, minutos: 0 }));

  for (const a of withHR) {
    const idx = getZoneIndex(a.avgHeartRate!, zones);
    counts[idx]!.corridas += 1;
    counts[idx]!.minutos += a.durationMin;
  }

  const data: ZoneBar[] = counts.map((c, i) => ({
    name: `Z${i + 1}`,
    corridas: c.corridas,
    minutos: Math.round(c.minutos),
    color: ZONE_COLORS[i] ?? '#888',
  }));

  return (
    <div className="chart-card">
      <h2>Zonas de Frequência Cardíaca</h2>
      <p style={{ fontSize: 12, color: '#888', marginTop: -8 }}>
        Classificação por FC média de cada corrida
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} width={36} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'minutos' ? [`${value} min`, 'Tempo total'] : [value, 'Corridas']
            }
            labelFormatter={(label: string) => {
              const idx = data.findIndex((d) => d.name === label);
              return ZONE_NAMES[idx] ?? label;
            }}
          />
          <Legend formatter={(value) => value === 'corridas' ? 'Corridas' : 'Tempo (min)'} />
          <Bar dataKey="corridas" name="corridas" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
