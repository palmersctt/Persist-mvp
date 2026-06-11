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
  const recovery = Math.round(30 + seeded(`${base}:recovery`) * 65); // 30–95
  const sleepHours = Math.round((5.5 + seeded(`${base}:sleep`) * 3) * 10) / 10; // 5.5–8.5
  const hrvMs = Math.round(40 + seeded(`${base}:hrv`) * 75); // 40–115
  const restingHr = Math.round(46 + seeded(`${base}:rhr`) * 18); // 46–64
  const sleepPerformance = Math.min(100, Math.round((sleepHours / 8) * 100));
  const dayStrain = Math.round(seeded(`${base}:strain`) * 14 * 10) / 10; // 0–14

  return {
    date,
    provider: 'demo',
    recovery,
    sleepHours,
    sleepPerformance,
    hrvMs,
    restingHr,
    dayStrain,
  };
}
