import type { Activity, Period } from '../types';

interface Props {
  activities: Activity[];
  period: Period;
}

interface Metrics {
  runs: number;
  distanceKm: number;
  avgPace: number;
  avgHR: number | null;
}

function formatPace(pace: number): string {
  if (pace === 0) return '—';
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

function delta(current: number, previous: number): { value: string; positive: boolean; neutral: boolean } {
  if (previous === 0) return { value: '—', positive: false, neutral: true };
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return {
    value: `${pct > 0 ? '+' : ''}${pct}%`,
    positive: pct > 0,
    neutral: pct === 0,
  };
}

function computeMetrics(acts: Activity[]): Metrics {
  if (acts.length === 0) return { runs: 0, distanceKm: 0, avgPace: 0, avgHR: null };
  const distanceKm = parseFloat(acts.reduce((s, a) => s + a.distanceKm, 0).toFixed(2));
  const totalMin = acts.reduce((s, a) => s + a.durationMin, 0);
  const avgPace = distanceKm > 0 ? totalMin / distanceKm : 0;
  const hrActs = acts.filter((a) => a.avgHeartRate !== null);
  const avgHR = hrActs.length > 0
    ? Math.round(hrActs.reduce((s, a) => s + (a.avgHeartRate ?? 0), 0) / hrActs.length)
    : null;
  return { runs: acts.length, distanceKm, avgPace, avgHR };
}

function filterPeriod(activities: Activity[], start: Date, end: Date): Activity[] {
  return activities.filter((a) => {
    const d = new Date(a.date);
    return d >= start && d < end;
  });
}

export function PeriodComparison({ activities, period }: Props) {
  if (period === 'all') return null;

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - period);

  const previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - period);

  const current = computeMetrics(filterPeriod(activities, currentStart, now));
  const previous = computeMetrics(filterPeriod(activities, previousStart, currentStart));

  const rows: { label: string; cur: string; prev: string; diff: ReturnType<typeof delta>; lowerIsBetter?: boolean }[] = [
    {
      label: 'Corridas',
      cur: String(current.runs),
      prev: String(previous.runs),
      diff: delta(current.runs, previous.runs),
    },
    {
      label: 'Distância',
      cur: `${current.distanceKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`,
      prev: `${previous.distanceKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`,
      diff: delta(current.distanceKm, previous.distanceKm),
    },
    {
      label: 'Pace médio',
      cur: formatPace(current.avgPace),
      prev: formatPace(previous.avgPace),
      diff: delta(current.avgPace, previous.avgPace),
      lowerIsBetter: true,
    },
    {
      label: 'FC média',
      cur: current.avgHR ? `${current.avgHR} bpm` : '—',
      prev: previous.avgHR ? `${previous.avgHR} bpm` : '—',
      diff: current.avgHR && previous.avgHR ? delta(current.avgHR, previous.avgHR) : { value: '—', positive: false, neutral: true },
    },
  ];

  const days = period;
  const prevLabel = `${days} dias anteriores`;
  const curLabel = `Últimos ${days} dias`;

  return (
    <div className="chart-card">
      <h2>Comparação de Períodos</h2>
      <table className="comparison-table">
        <thead>
          <tr>
            <th></th>
            <th>{curLabel}</th>
            <th>{prevLabel}</th>
            <th>Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isGood = r.lowerIsBetter ? !r.diff.positive : r.diff.positive;
            const color = r.diff.neutral ? '#888' : isGood ? '#34d399' : '#f87171';
            return (
              <tr key={r.label}>
                <td className="comparison-label">{r.label}</td>
                <td className="comparison-current">{r.cur}</td>
                <td className="comparison-prev">{r.prev}</td>
                <td style={{ color, fontWeight: 600 }}>{r.diff.value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
