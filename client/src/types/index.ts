export interface Activity {
  id: number;
  name: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  paceMinKm: number;
  paceFormatted: string;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainM: number;
  avgCadence: number | null;
}

export interface SummaryMetrics {
  totalRuns: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  avgPaceMinKm: number;
  avgPaceFormatted: string;
  bestPaceMinKm: number;
  bestPaceFormatted: string;
  avgHeartRate: number | null;
  totalElevationGainM: number;
}

export type Period = 30 | 90 | 180 | 365 | 'all';
