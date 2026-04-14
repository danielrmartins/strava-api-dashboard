import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getLast365Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ConsistencyHeatmap({ activities }: Props) {
  // Build a map of date -> km
  const kmByDay = new Map<string, number>();
  for (const a of activities) {
    const key = a.date.slice(0, 10);
    kmByDay.set(key, (kmByDay.get(key) ?? 0) + a.distanceKm);
  }

  const days = getLast365Days();

  // Pad so the first day falls on its correct weekday column
  const firstDow = days[0]?.getDay() ?? 0;
  const padded: (Date | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...days,
  ];

  // Split into weeks (columns)
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month labels — find first occurrence of each month
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const first = week.find((d) => d !== null);
    if (first && first.getMonth() !== lastMonth) {
      lastMonth = first.getMonth();
      monthLabels.push({ col, label: MONTHS[lastMonth] ?? '' });
    }
  });

  function getColor(date: Date | null): string {
    if (!date) return 'transparent';
    const km = kmByDay.get(toKey(date)) ?? 0;
    if (km === 0) return '#1e1e1e';
    if (km < 5) return '#7c3b0e';
    if (km < 10) return '#c2540a';
    if (km < 20) return '#fc4c02';
    return '#ff8c5a';
  }

  const totalDaysRan = days.filter((d) => (kmByDay.get(toKey(d)) ?? 0) > 0).length;
  const longestStreak = (() => {
    let max = 0, cur = 0;
    for (const d of days) {
      if ((kmByDay.get(toKey(d)) ?? 0) > 0) { cur++; max = Math.max(max, cur); }
      else cur = 0;
    }
    return max;
  })();

  return (
    <div className="chart-card heatmap-card" style={{ gridColumn: '1 / -1' }}>
      <div className="heatmap-header">
        <h2>Consistência — últimos 12 meses</h2>
        <div className="heatmap-stats">
          <span>{totalDaysRan} dias corridos</span>
          <span>Maior sequência: {longestStreak} dias</span>
        </div>
      </div>

      <div className="heatmap-wrapper">
        {/* Day labels */}
        <div className="heatmap-days">
          {DAYS.map((d) => <span key={d}>{d}</span>)}
        </div>

        <div className="heatmap-grid-wrapper">
          {/* Month labels */}
          <div className="heatmap-months">
            {monthLabels.map(({ col, label }) => (
              <span key={col} style={{ gridColumn: col + 1 }}>{label}</span>
            ))}
          </div>

          {/* Grid */}
          <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const km = day ? (kmByDay.get(toKey(day)) ?? 0) : 0;
                const title = day
                  ? `${day.toLocaleDateString('pt-BR')}: ${km > 0 ? `${km.toFixed(1)} km` : 'sem corrida'}`
                  : '';
                return (
                  <div
                    key={`${wi}-${di}`}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(day), gridRow: di + 1, gridColumn: wi + 1 }}
                    title={title}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Menos</span>
        {['#1e1e1e', '#7c3b0e', '#c2540a', '#fc4c02', '#ff8c5a'].map((c) => (
          <div key={c} className="heatmap-cell" style={{ backgroundColor: c }} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
