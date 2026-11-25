import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { DayInputs, Verdict } from '../lib/model';
import { historyFrom, NO_HISTORY, type DayRow, type PastDays } from '../lib/engine/history';

// The signed-in user's logged days (from /api/day-inputs) as the engine's
// history, plus save() for today's inputs. Never blocks the dashboard: until
// history loads, or if it can't, the verdict runs in day-one mode.
export function useDayHistory() {
  const { status } = useSession();
  const [rows, setRows] = useState<DayRow[] | null>(null);
  const lastSaved = useRef<string | null>(null);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: timezone });

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch(`/api/day-inputs?timezone=${encodeURIComponent(timezone)}`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d: { rows?: DayRow[] }) => {
        if (!cancelled) setRows(Array.isArray(d.rows) ? d.rows : []);
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

  return { past, loaded: rows !== null, save };
}
