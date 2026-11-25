import { describe, it, expect } from 'vitest';
import { bearerToken, checkRate, cleanLabel, hashToken, newToken, TOKEN_PREFIX } from './tokens';

describe('tokens', () => {
  it('makes distinct, prefixed tokens', () => {
    const a = newToken();
    const b = newToken();
    expect(a.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(40);
  });

  it('hashes deterministically without revealing the token', () => {
    const t = newToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).not.toContain(t.slice(4, 12));
  });

  it('reads only our bearer tokens', () => {
    expect(bearerToken('Bearer pst_abc')).toBe('pst_abc');
    expect(bearerToken('bearer pst_abc')).toBe('pst_abc');
    expect(bearerToken('Bearer sk-other')).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
    expect(bearerToken('pst_abc')).toBeNull();
  });

  it('cleans labels', () => {
    expect(cleanLabel('  Claude  ')).toBe('Claude');
    expect(cleanLabel('')).toBeNull();
    expect(cleanLabel(42)).toBeNull();
    expect(cleanLabel('x'.repeat(80))).toHaveLength(60);
  });
});

describe('checkRate', () => {
  const now = new Date('2026-11-25T12:00:00Z');

  it('starts a window on first use', () => {
    expect(checkRate({ window_start: null, window_calls: 0 }, now)).toEqual({
      allowed: true,
      next: { window_start: now.toISOString(), window_calls: 1 },
    });
  });

  it('counts within the hour and stops at the limit', () => {
    const w = { window_start: '2026-11-25T11:30:00Z', window_calls: 59 };
    const r = checkRate(w, now);
    expect(r).toEqual({ allowed: true, next: { ...w, window_calls: 60 } });
    expect(checkRate(r.next, now).allowed).toBe(false);
  });

  it('resets after an hour', () => {
    const r = checkRate({ window_start: '2026-11-25T10:59:59Z', window_calls: 60 }, now);
    expect(r.allowed).toBe(true);
    expect(r.next.window_calls).toBe(1);
  });
});
