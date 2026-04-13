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

export async function fetchAllRuns(): Promise<StravaActivity[]> {
  const token = await getValidToken();
  const runs: StravaActivity[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await axios.get<StravaActivity[]>(`${STRAVA_API}/athlete/activities`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: perPage, page, type: 'Run' },
    });

    const activities = response.data;
    if (activities.length === 0) break;

    const filtered = activities.filter((a) => a.type === 'Run');
    runs.push(...filtered);

    if (activities.length < perPage) break;
    page++;
  }

  return runs;
}
