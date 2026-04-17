import { useState } from 'react';
import { useActivities } from '../hooks/useActivities';
import { useFilteredData } from '../hooks/useFilteredData';
import { useHRZones } from '../hooks/useHRZones';
import { SummaryCards } from '../components/SummaryCards';
import { WeeklyDistanceChart } from '../components/WeeklyDistanceChart';
import { VolumePaceChart } from '../components/VolumePaceChart';
import { HeartRateZonesChart } from '../components/HeartRateZonesChart';
import { ConsistencyHeatmap } from '../components/ConsistencyHeatmap';
import { PeriodComparison } from '../components/PeriodComparison';
import { ActivitiesTable } from '../components/ActivitiesTable';
import { OvertrainingChart } from '../components/OvertrainingChart';
import { VO2MaxChart } from '../components/VO2MaxChart';
import { WeeklyProgressionChart } from '../components/WeeklyProgressionChart';
import { PeriodFilter } from '../components/PeriodFilter';
import type { Period } from '../types';

interface Props {
  athleteName?: string;
}

export function Dashboard({ athleteName }: Props) {
  const { activities, loading, error, refetch } = useActivities();
  const [period, setPeriod] = useState<Period>(90);
  const { filtered, summary } = useFilteredData(activities, period);
  const stravaZones = useHRZones();

  // Fallback: calculate zones from max HR in activities if Strava zones unavailable
  const hrZones = stravaZones ?? (() => {
    const maxHR = Math.max(...activities.map((a) => a.maxHeartRate ?? 0).filter((v) => v > 0));
    if (maxHR === 0) return null;
    const pcts = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    return pcts.slice(0, -1).map((p, i) => ({
      min: Math.round(p * maxHR),
      max: i === 4 ? -1 : Math.round(pcts[i + 1]! * maxHR),
    }));
  })();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Carregando atividades...</p>
        {activities.length === 0 && (
          <p className="loading-hint">Na primeira execução pode demorar um pouco.</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Erro ao carregar dados: {error}</p>
        <button onClick={refetch}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Corre que é Dado</h1>
          {athleteName && <span className="header-athlete">{athleteName}</span>}
        </div>
        <div className="header-actions">
          <PeriodFilter value={period} onChange={setPeriod} />
          <button className="btn-refresh" onClick={refetch}>Atualizar</button>
          <button
            className="btn-logout"
            onClick={() => fetch('/auth/logout', { method: 'POST' }).then(() => location.reload())}
          >
            Sair
          </button>
        </div>
      </header>

      <SummaryCards summary={summary} />

      <div className="section-title">Performance</div>
      <div className="charts-grid">
        <VolumePaceChart activities={filtered} />
        <VO2MaxChart activities={filtered} />
      </div>

      <div className="section-title">Análise</div>
      <div className="charts-grid">
        <WeeklyDistanceChart activities={filtered} />
        <WeeklyProgressionChart activities={filtered} />
        {hrZones && <HeartRateZonesChart activities={filtered} zones={hrZones} />}
        <PeriodComparison activities={activities} period={period} />
      </div>

      <div className="section-title">Overtraining</div>
      <div className="charts-grid">
        <OvertrainingChart activities={activities} />
      </div>

      <div className="section-title">Consistência</div>
      <div className="charts-grid">
        <ConsistencyHeatmap activities={activities} />
      </div>

      <div className="section-title">Atividades</div>
      <div className="charts-grid">
        <ActivitiesTable activities={filtered} />
      </div>
    </div>
  );
}
