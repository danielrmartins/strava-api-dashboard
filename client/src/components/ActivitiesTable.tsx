import { useState } from 'react';
import type { Activity } from '../types';

interface Props {
  activities: Activity[];
}

type SortKey = 'date' | 'distanceKm' | 'paceMinKm' | 'avgHeartRate' | 'elevationGainM';
type SortDir = 'asc' | 'desc';

const STRAVA_ACTIVITY_URL = 'https://www.strava.com/activities';
const PAGE_SIZE = 15;

export function ActivitiesTable({ activities }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  const sorted = [...activities].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === 'date') {
      av = new Date(a.date).getTime();
      bv = new Date(b.date).getTime();
    } else if (sortKey === 'avgHeartRate') {
      av = a.avgHeartRate ?? 0;
      bv = b.avgHeartRate ?? 0;
    } else {
      av = a[sortKey];
      bv = b[sortKey];
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function th(label: string, key: SortKey) {
    return (
      <th onClick={() => handleSort(key)} className="sortable-th">
        {label} <SortIcon col={key} />
      </th>
    );
  }

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <h2>Atividades Recentes</h2>
      <div className="table-wrapper">
        <table className="activities-table">
          <thead>
            <tr>
              {th('Data', 'date')}
              <th>Nome</th>
              {th('Distância', 'distanceKm')}
              {th('Pace', 'paceMinKm')}
              {th('FC Média', 'avgHeartRate')}
              {th('Elevação', 'elevationGainM')}
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((a) => (
              <tr key={a.id}>
                <td className="td-muted">
                  {new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                <td className="td-name">{a.name}</td>
                <td>{a.distanceKm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km</td>
                <td>{a.paceFormatted}</td>
                <td>{a.avgHeartRate ? `${a.avgHeartRate} bpm` : '—'}</td>
                <td>{a.elevationGainM} m</td>
                <td>
                  <a
                    href={`${STRAVA_ACTIVITY_URL}/${a.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="strava-link"
                  >
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ←
          </button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
