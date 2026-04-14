import { useState } from 'react';
import { useActivities } from '../hooks/useActivities';
import { useFilteredData } from '../hooks/useFilteredData';
import { useHRZones } from '../hooks/useHRZones';
import { SummaryCards } from '../components/SummaryCards';
import { PaceChart } from '../components/PaceChart';
import { HeartRateChart } from '../components/HeartRateChart';
import { WeeklyDistanceChart } from '../components/WeeklyDistanceChart';
import { VolumePaceChart } from '../components/VolumePaceChart';
import { HeartRateZonesChart } from '../components/HeartRateZonesChart';
import { PersonalRecords } from '../components/PersonalRecords';
import { ConsistencyHeatmap } from '../components/ConsistencyHeatmap';
import { PeriodComparison } from '../components/PeriodComparison';
import { ActivitiesTable } from '../components/ActivitiesTable';
import { OvertrainingChart } from '../components/OvertrainingChart';
import { PeriodFilter } from '../components/PeriodFilter';
import type { Period } from '../types';

export function Dashboard() {
  const { activities, loading, error, refetch } = useActivities();
  const [period, setPeriod] = useState<Period>(90);
  const { filtered, summary } = useFilteredData(activities, period);
  const hrZones = useHRZones();

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
        <h1>Strava Dashboard</h1>
        <div className="header-actions">
          <PeriodFilter value={period} onChange={setPeriod} />
          <button className="btn-refresh" onClick={refetch} title="Atualizar dados">
            Atualizar
          </button>
        </div>
      </header>

      <SummaryCards summary={summary} />

      <div className="section-title">Performance</div>
      <div className="charts-grid">
        <PaceChart activities={filtered} />
        <HeartRateChart activities={filtered} />
        <VolumePaceChart activities={filtered} />
      </div>

      <div className="section-title">Análise</div>
      <div className="charts-grid">
        <WeeklyDistanceChart activities={filtered} />
        {hrZones && <HeartRateZonesChart activities={filtered} zones={hrZones} />}
        <PeriodComparison activities={activities} period={period} />
        <PersonalRecords activities={activities} />
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
