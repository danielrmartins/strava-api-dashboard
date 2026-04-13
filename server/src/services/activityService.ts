import { fetchAllRuns } from './stravaService.js';
import { readCache, writeCache, isCacheValid } from './cacheService.js';

export interface Activity {
  id: number;
  name: string;
  date: string;           // ISO date string
  distanceKm: number;     // km, 2 decimal places
  durationMin: number;    // total moving time in minutes
  paceMinKm: number;      // average pace in min/km (decimal)
  paceFormatted: string;  // "MM:SS /km"
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainM: number; // meters
  avgCadence: number | null; // steps/min (strava gives per-leg, we double it)
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
  const minutes = Math.floor(paceMinKm);
  const seconds = Math.round((paceMinKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

function toActivity(raw: Awaited<ReturnType<typeof fetchAllRuns>>[number]): Activity {
  const distanceKm = parseFloat((raw.distance / 1000).toFixed(2));
  const durationMin = parseFloat((raw.moving_time / 60).toFixed(2));

  // pace = min/km; avoid division by zero for very short activities
  const paceMinKm =
    distanceKm > 0 ? parseFloat((durationMin / distanceKm).toFixed(4)) : 0;

  // Strava cadence is per leg (one foot), multiply by 2 for total SPM
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

export async function getActivities(forceRefresh = false): Promise<Activity[]> {
  if (!forceRefresh) {
    const cache = await readCache();
    if (cache && isCacheValid(cache)) {
      return cache.activities;
    }
  }

  const raw = await fetchAllRuns();
  const activities = raw.map(toActivity).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  await writeCache(activities);
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
    activities.reduce((sum, a) => sum + a.distanceKm, 0).toFixed(2)
  );
  const totalDurationMin = parseFloat(
    activities.reduce((sum, a) => sum + a.durationMin, 0).toFixed(2)
  );

  // Weighted average pace (weighted by distance)
  const avgPaceMinKm =
    totalDistanceKm > 0
      ? parseFloat((totalDurationMin / totalDistanceKm).toFixed(4))
      : 0;

  // Best pace = lowest min/km among runs with distance > 1km
  const validRuns = activities.filter((a) => a.distanceKm >= 1);
  const bestPaceMinKm =
    validRuns.length > 0
      ? Math.min(...validRuns.map((a) => a.paceMinKm))
      : 0;

  // Average heart rate (only runs that have HR data)
  const hrRuns = activities.filter((a) => a.avgHeartRate !== null);
  const avgHeartRate =
    hrRuns.length > 0
      ? Math.round(hrRuns.reduce((sum, a) => sum + (a.avgHeartRate ?? 0), 0) / hrRuns.length)
      : null;

  const totalElevationGainM = activities.reduce((sum, a) => sum + a.elevationGainM, 0);

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
