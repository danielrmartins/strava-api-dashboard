import { useState, useEffect } from 'react';
import type { Activity } from '../types';

interface UseActivitiesResult {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useActivities(): UseActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/activities');

        if (res.status === 401) {
          // Session expired — reload to show Login page
          window.location.reload();
          return;
        }

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data: Activity[] = await res.json();
        if (!cancelled) setActivities(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [tick]);

  const refetch = () => setTick((t) => t + 1);

  return { activities, loading, error, refetch };
}
