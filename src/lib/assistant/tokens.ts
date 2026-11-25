// Personal access tokens for assistants. Server-only (Node crypto).
// A token is shown to the user once; only its SHA-256 hash is stored.

import { createHash, randomBytes } from 'crypto';

export const TOKEN_PREFIX = 'pst_';
/** Calls allowed per token per rolling hour window. */
export const CALLS_PER_HOUR = 60;
const HOUR_MS = 3_600_000;

/** A new random token, e.g. pst_3q2…; 32 bytes of entropy. */
export function newToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The bearer token from an Authorization header, if it looks like ours. */
export function bearerToken(header: string | string[] | undefined): string | null {
  const h = Array.isArray(header) ? header[0] : header;
  const m = /^Bearer\s+(\S+)$/i.exec(h ?? '');
  return m && m[1].startsWith(TOKEN_PREFIX) ? m[1] : null;
}

export interface RateWindow {
  window_start: string | null;
  window_calls: number;
}

/**
 * Count one call against the token's hourly window. Returns whether it is
 * allowed and the window to store back.
 */
export function checkRate(
  w: RateWindow,
  now: Date,
  limit = CALLS_PER_HOUR
): { allowed: boolean; next: RateWindow } {
  const start = w.window_start ? Date.parse(w.window_start) : NaN;
  const fresh = !Number.isFinite(start) || now.getTime() - start >= HOUR_MS;
  const calls = fresh ? 0 : w.window_calls;
  if (calls >= limit) return { allowed: false, next: w };
  return {
    allowed: true,
    next: {
      window_start: fresh ? now.toISOString() : (w.window_start as string),
      window_calls: calls + 1,
    },
  };
}

/** A short label: trimmed, 1–60 characters. */
export function cleanLabel(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim().slice(0, 60);
  return t.length > 0 ? t : null;
}
