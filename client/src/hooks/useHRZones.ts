import { useState, useEffect } from 'react';

export interface HRZone {
  min: number;
  max: number;
}

export function useHRZones() {
  const [zones, setZones] = useState<HRZone[] | null>(null);

  useEffect(() => {
    fetch('/athlete/zones')
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<HRZone[]>;
      })
      .then((data) => setZones(data))
      .catch(() => setZones(null));
  }, []);

  return zones;
}
