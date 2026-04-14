import { useState, useEffect } from 'react';

export interface HRZone {
  min: number;
  max: number;
}

export function useHRZones() {
  const [zones, setZones] = useState<HRZone[] | null>(null);

  useEffect(() => {
    fetch('/athlete/zones')
      .then((r) => r.json())
      .then((data: HRZone[]) => setZones(data))
      .catch(() => setZones(null));
  }, []);

  return zones;
}
