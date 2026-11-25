// Where assistant calls read and write a user's days. The interface keeps
// the tool logic testable; the Supabase implementation is server-only.

import type { Verdict } from '../model';
import type { DayRow, FeelRating } from '../engine/history';

export interface StoredDay extends DayRow {
  verdict?: Verdict;
  readiness?: number;
  feelRating?: FeelRating | null;
}

export interface DayStore {
  /** The user's rows with since ≤ date ≤ until, oldest first. */
  days(email: string, since: string, until: string): Promise<StoredDay[]>;
  /** Insert or replace the user's row for row.date. */
  saveDay(email: string, row: StoredDay, source: 'dashboard' | 'assistant'): Promise<void>;
  /** Rate an existing row; false when that day was never scored. */
  rate(email: string, date: string, rating: FeelRating): Promise<boolean>;
}

/** An in-memory store, for tests. */
export function memoryStore(): DayStore & { rows: Map<string, StoredDay & { source: string }> } {
  const rows = new Map<string, StoredDay & { source: string }>();
  const key = (email: string, date: string) => `${email}|${date}`;
  return {
    rows,
    async days(email, since, until) {
      return [...rows.entries()]
        .filter(([k, r]) => k.startsWith(`${email}|`) && r.date >= since && r.date <= until)
        .map(([, r]) => r)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    async saveDay(email, row, source) {
      const prev = rows.get(key(email, row.date));
      rows.set(key(email, row.date), { feelRating: prev?.feelRating ?? null, ...row, source });
    },
    async rate(email, date, rating) {
      const r = rows.get(key(email, date));
      if (!r) return false;
      r.feelRating = rating;
      return true;
    },
  };
}
