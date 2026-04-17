import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

interface PREntry {
  label: string;
  minKm: number;
  maxKm: number;
  targetKm: number;
}

const DISTANCES: PREntry[] = [
  { label: '10 km',    minKm: 9.7,  maxKm: 10.4, targetKm: 10.0   },
  { label: 'Meia',     minKm: 20.5, maxKm: 22.0, targetKm: 21.097 },
  { label: 'Maratona', minKm: 41.0, maxKm: 43.5, targetKm: 42.195 },
];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes % 1) * 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m}min ${s.toString().padStart(2, '0')}s`;
}

export function PersonalRecords({ activities }: Props) {
  const records = DISTANCES.map(({ label, minKm, maxKm, targetKm }) => {
    const candidates = activities.filter(
      (a) => a.distanceKm >= minKm && a.distanceKm <= maxKm && a.paceMinKm > 0
    );
    if (candidates.length === 0) return { label, pace: null, duration: null, date: null };

    const best = candidates.reduce((a, b) => (a.paceMinKm < b.paceMinKm ? a : b));
    return {
      label,
      pace: best.paceFormatted,
      duration: formatDuration(best.paceMinKm * targetKm),
      date: new Date(best.date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }),
    };
  });

  return (
    <div className="chart-card">
      <h2>Personal Records</h2>
      <table className="pr-table">
        <thead>
          <tr>
            <th>Distância</th>
            <th>Pace</th>
            <th>Tempo</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.label}>
              <td className="pr-distance">{r.label}</td>
              <td className="pr-pace">{r.pace ?? '—'}</td>
              <td>{r.duration ?? '—'}</td>
              <td className="pr-date">{r.date ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
