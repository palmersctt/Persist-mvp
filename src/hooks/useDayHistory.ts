import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { DayInputs, Verdict } from '../lib/model';
import {
  historyFrom,
  NO_HISTORY,
  type DayRow,
  type FeelRating,
  type PastDays,
} from '../lib/engine/history';

// The signed-in user's logged days (from /api/day-inputs) as the engine's
// history, plus save() for today's inputs. Never blocks the dashboard: until
// history loads, or if it can't, the verdict runs in day-one mode.
export function useDayHistory() {
  const { status } = useSession();
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [feel, setFeel] = useState<Record<string, FeelRating>>({});
  const lastSaved = useRef<string | null>(null);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: timezone });

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch(`/api/day-inputs?timezone=${encodeURIComponent(timezone)}`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d: { rows?: DayRow[]; feel?: Record<string, FeelRating> }) => {
        if (cancelled) return;
        setRows(Array.isArray(d.rows) ? d.rows : []);
        if (d.feel && typeof d.feel === 'object') setFeel(d.feel);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [status, timezone]);

  const past: PastDays = useMemo(
    () => (rows ? historyFrom(rows, today) : NO_HISTORY),
    [rows, today]
  );

  /**
   * Save today's inputs and the verdict shown; identical repeats are skipped.
   * Failures are quiet.
   */
  const save = useCallback(
    (inputs: DayInputs, shown?: { verdict: Verdict; readiness: number }) => {
      const body = JSON.stringify({ date: today, ...inputs, ...shown });
      if (body === lastSaved.current) return;
      lastSaved.current = body;
      fetch(`/api/day-inputs?timezone=${encodeURIComponent(timezone)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => {
        lastSaved.current = null;
      });
    },
    [today, timezone]
  );

  /** Rate a day (today or yesterday). Optimistic; resolves to whether it stuck. */
  const rate = useCallback(
    async (date: string, rating: FeelRating): Promise<boolean> => {
      const before = feel[date];
      setFeel((f) => ({ ...f, [date]: rating }));
      try {
        const r = await fetch(`/api/day-inputs?timezone=${encodeURIComponent(timezone)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, rating }),
        });
        const ok = r.ok && (await r.json()).stored === true;
        if (!ok) throw new Error('not stored');
        return true;
      } catch {
        setFeel((f) => {
          const next = { ...f };
          if (before) next[date] = before;
          else delete next[date];
          return next;
        });
        return false;
      }
    },
    [feel, timezone]
  );

  return { past, loaded: rows !== null, save, today, feel, rate };
}
