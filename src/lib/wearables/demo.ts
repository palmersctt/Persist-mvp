import type { WearableActuals } from './types';

// Deterministic demo actuals — lets anyone walk the full forecast-vs-actual
// flow without owning a device. Same email + date always produces the same
// numbers, so the dashboard stays stable across refreshes within a day.

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded 0–1 float from any string. */
function seeded(seed: string): number {
  return hashString(seed) / 4294967295;
}

export function generateDemoActuals(email: string, date: string): WearableActuals {
  const base = `${email}:${date}`;
  // Strava-shaped: training-load freshness plus the activity factors the
  // breakdown reads. Deterministic so the dashboard stays stable across a day.
  const freshness = Math.round(20 + seeded(`${base}:freshness`) * 75); // 20–95
  const weekActivityCount = Math.round(2 + seeded(`${base}:week`) * 6); // 2–8
  const durationMin = Math.round(35 + seeded(`${base}:dur`) * 70); // 35–105
  const distanceKm = Math.round((4 + seeded(`${base}:dist`) * 16) * 10) / 10; // 4.0–20.0

  return {
    date,
    provider: 'demo',
    freshness,
    weekActivityCount,
    lastActivity: {
      type: 'Run',
      startISO: `${date}T06:30:00Z`,
      durationMin,
      distanceKm,
    },
  };
}
