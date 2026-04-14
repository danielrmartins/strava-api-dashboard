import type { SummaryMetrics } from '../types';

interface Props {
  summary: SummaryMetrics;
}

interface CardProps {
  label: string;
  value: string | number;
  unit?: string;
}

function Card({ label, value, unit }: CardProps) {
  return (
    <div className="card">
      <span className="card-label">{label}</span>
      <span className="card-value">
        {value}
        {unit && <span className="card-unit"> {unit}</span>}
      </span>
    </div>
  );
}

export function SummaryCards({ summary }: Props) {
  return (
    <div className="summary-cards">
      <Card label="Corridas" value={summary.totalRuns} />
      <Card
        label="Distância total"
        value={summary.totalDistanceKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
        unit="km"
      />
      <Card label="Pace médio" value={summary.avgPaceFormatted} />
      <Card label="Melhor pace" value={summary.bestPaceFormatted} />
      {summary.avgHeartRate !== null && (
        <Card label="FC média" value={summary.avgHeartRate} unit="bpm" />
      )}
      <Card
        label="Elevação total"
        value={summary.totalElevationGainM.toLocaleString('pt-BR')}
        unit="m"
      />
    </div>
  );
}
