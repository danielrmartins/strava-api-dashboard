import { useMemo } from 'react';
import type { Activity, Period, SummaryMetrics } from '../types';

function filterByPeriod(activities: Activity[], period: Period): Activity[] {
  if (period === 'all') return activities;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);

  return activities.filter((a) => new Date(a.date) >= cutoff);
}

function computeSummary(activities: Activity[]): SummaryMetrics {
  if (activities.length === 0) {
    return {
      totalRuns: 0,
      totalDistanceKm: 0,
      totalDurationMin: 0,
      avgPaceMinKm: 0,
      avgPaceFormatted: '0:00 /km',
      bestPaceMinKm: 0,
      bestPaceFormatted: '0:00 /km',
      avgHeartRate: null,
      totalElevationGainM: 0,
    };
  }

  const totalDistanceKm = parseFloat(
    activities.reduce((s, a) => s + a.distanceKm, 0).toFixed(2)
  );
  const totalDurationMin = parseFloat(
    activities.reduce((s, a) => s + a.durationMin, 0).toFixed(2)
  );
  const avgPaceMinKm =
    totalDistanceKm > 0
      ? parseFloat((totalDurationMin / totalDistanceKm).toFixed(4))
      : 0;

  const validRuns = activities.filter((a) => a.distanceKm >= 1);
  const bestPaceMinKm =
    validRuns.length > 0 ? Math.min(...validRuns.map((a) => a.paceMinKm)) : 0;

  const hrRuns = activities.filter((a) => a.avgHeartRate !== null);
  const avgHeartRate =
    hrRuns.length > 0
      ? Math.round(hrRuns.reduce((s, a) => s + (a.avgHeartRate ?? 0), 0) / hrRuns.length)
      : null;

  const totalElevationGainM = activities.reduce((s, a) => s + a.elevationGainM, 0);

  function fmt(pace: number) {
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')} /km`;
  }

  return {
    totalRuns: activities.length,
    totalDistanceKm,
    totalDurationMin,
    avgPaceMinKm,
    avgPaceFormatted: fmt(avgPaceMinKm),
    bestPaceMinKm,
    bestPaceFormatted: fmt(bestPaceMinKm),
    avgHeartRate,
    totalElevationGainM,
  };
}

interface UseFilteredDataResult {
  filtered: Activity[];
  summary: SummaryMetrics;
}

export function useFilteredData(activities: Activity[], period: Period): UseFilteredDataResult {
  const filtered = useMemo(() => filterByPeriod(activities, period), [activities, period]);
  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  return { filtered, summary };
}
