import { fetchAllRuns } from './stravaService.js';
import { readCache, writeCache } from './cacheService.js';

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

function formatPace(paceMinKm: number): string {
  let minutes = Math.floor(paceMinKm);
  let seconds = Math.round((paceMinKm - minutes) * 60);
  if (seconds === 60) { minutes += 1; seconds = 0; }
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

function toActivity(raw: Awaited<ReturnType<typeof fetchAllRuns>>[number]): Activity {
  const distanceKm = parseFloat((raw.distance / 1000).toFixed(2));
  const durationMin = parseFloat((raw.moving_time / 60).toFixed(2));
  const paceMinKm =
    distanceKm > 0 ? parseFloat((durationMin / distanceKm).toFixed(4)) : 0;
  const avgCadence =
    raw.average_cadence != null ? Math.round(raw.average_cadence * 2) : null;

  return {
    id: raw.id,
    name: raw.name,
    date: raw.start_date,
    distanceKm,
    durationMin,
    paceMinKm,
    paceFormatted: formatPace(paceMinKm),
    avgHeartRate: raw.average_heartrate ?? null,
    maxHeartRate: raw.max_heartrate ?? null,
    elevationGainM: Math.round(raw.total_elevation_gain),
    avgCadence,
  };
}

export async function getActivities(sid: string, forceRefresh = false): Promise<Activity[]> {
  if (!forceRefresh) {
    const cached = await readCache(sid);
    if (cached) return cached;
  }

  const raw = await fetchAllRuns(sid);
  const activities = raw
    .map(toActivity)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  await writeCache(sid, activities);
  return activities;
}

export function computeSummary(activities: Activity[]): SummaryMetrics {
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

  return {
    totalRuns: activities.length,
    totalDistanceKm,
    totalDurationMin,
    avgPaceMinKm,
    avgPaceFormatted: formatPace(avgPaceMinKm),
    bestPaceMinKm,
    bestPaceFormatted: formatPace(bestPaceMinKm),
    avgHeartRate,
    totalElevationGainM,
  };
}
