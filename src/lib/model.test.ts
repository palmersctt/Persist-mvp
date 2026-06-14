import { describe, it, expect } from 'vitest';
import { runModel, workIndex, type DayInputs, type Prior } from './model';

// today inputs from a wv (work valence): workIndex = 50 + wv*50
const day = (o: Partial<DayInputs> & { wv: number }): DayInputs => ({
  workLoad: o.workLoad ?? 0,
  workIndex: 50 + o.wv * 50,
  trainingLoad: o.trainingLoad ?? 0,
  trainingFeel: o.trainingFeel ?? 0,
  sleep: o.sleep ?? 62,
});

describe('workIndex', () => {
  it('rewards Focus and Balance, penalizes Strain', () => {
    expect(workIndex(100, 100, 0)).toBe(100);
    expect(workIndex(0, 0, 100)).toBe(0);
    expect(workIndex(50, 50, 50)).toBe(50); // neutral day
  });

  it('separates good-heavy from bad-heavy at equal volume', () => {
    const deep = workIndex(70, 60, 50); // flow blocks, boundaries held
    const fragmented = workIndex(25, 30, 85); // back-to-back, context-switching
    expect(deep).toBeGreaterThan(50);
    expect(fragmented).toBeLessThan(35);
  });
});

describe('runModel — baseline is seeded from the prior, not day-1 data', () => {
  it('reads a spike on day one without any logged history', () => {
    const prior: Prior = { load: 100, trainingLoad: 50 };
    const r = runModel(prior, [], day({ wv: 0, workLoad: 100, trainingLoad: 100 })); // today load 200
    // baseline stayed at 100; recent jumped to 200 → ~2x, not the bootstrapped 1.0
    expect(r.acwr).toBeGreaterThan(1.8);
    expect(r.days).toBe(1);
  });
});

describe('runModel — day-1 verdicts (the money cases)', () => {
  it('off the couch → Survival (low baseline, hard today spikes)', () => {
    const r = runModel(
      { load: 54, trainingLoad: 8 },
      [],
      day({ workLoad: 44, wv: 0.1, trainingLoad: 64, trainingFeel: -0.1, sleep: 66 })
    );
    expect(r.verdict).toBe('Survival');
    expect(r.tier).toBe('bad');
    expect(r.acwr).toBeGreaterThan(1.7);
  });

  it('seasoned athlete → Flow (same hard session, high baseline)', () => {
    const r = runModel(
      { load: 104, trainingLoad: 56 },
      [],
      day({ workLoad: 44, wv: 0.1, trainingLoad: 64, trainingFeel: 0.1, sleep: 69 })
    );
    expect(r.verdict).toBe('Flow');
    expect(r.tier).toBe('good');
  });

  it('slammed but fulfilling work + quiet training → Locked In', () => {
    const r = runModel(
      { load: 80, trainingLoad: 40 },
      [],
      day({ workLoad: 88, wv: 0.55, trainingLoad: 0, trainingFeel: 0, sleep: 69 })
    );
    expect(r.verdict).toBe('Locked In');
    expect(r.trainingAcwr).toBeLessThan(0.82);
  });

  it('light but draining → Grinding', () => {
    const r = runModel(
      { load: 70, trainingLoad: 30 },
      [],
      day({ workLoad: 28, wv: -0.5, trainingLoad: 16, trainingFeel: -0.2, sleep: 61 })
    );
    expect(r.verdict).toBe('Grinding');
    expect(r.tier).toBe('ok');
    expect(r.fill).toBeLessThan(0);
  });

  it('charged + genuinely light → Flow', () => {
    const r = runModel(
      { load: 80, trainingLoad: 40 },
      [],
      day({ workLoad: 30, wv: 0.4, trainingLoad: 42, trainingFeel: 0.4, sleep: 78 })
    );
    expect(r.verdict).toBe('Flow');
    expect(r.value).toBeGreaterThan(66);
  });

  it('flat load and feel in-band → Coasting', () => {
    const r = runModel(
      { load: 80, trainingLoad: 40 },
      [],
      day({ workLoad: 36, wv: -0.05, trainingLoad: 40, trainingFeel: -0.05, sleep: 56 })
    );
    expect(r.verdict).toBe('Coasting');
    expect(r.tier).toBe('ok');
  });
});
