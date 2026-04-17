import axios from 'axios';
import { getValidToken } from './tokenService.js';

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
}

const STRAVA_API = 'https://www.strava.com/api/v3';

const DEFAULT_FETCH_YEARS = 2;

export async function fetchAllRuns(sid: string, years = DEFAULT_FETCH_YEARS): Promise<StravaActivity[]> {
  const token = await getValidToken(sid);
  const runs: StravaActivity[] = [];
  let page = 1;
  const perPage = 100;

  // Only fetch activities after this timestamp to limit API calls
  const after = Math.floor(Date.now() / 1000) - years * 365 * 24 * 60 * 60;

  while (true) {
    try {
      const response = await axios.get<StravaActivity[]>(`${STRAVA_API}/athlete/activities`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: perPage, page, after },
      });

      const activities = response.data;
      if (activities.length === 0) break;

      runs.push(...activities.filter((a) => a.type === 'Run'));

      if (activities.length < perPage) break;
      page++;

      // Small pause between pages to be kind to the API
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        // Rate limited — return what we have so far instead of failing
        break;
      }
      throw err;
    }
  }

  return runs;
}
