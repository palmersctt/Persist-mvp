// The Supabase-backed DayStore (service role; server-only).
import { supabaseAdmin } from '../../../lib/supabase';
import type { Verdict } from '../model';
import type { FeelRating } from '../engine/history';
import type { DayStore, StoredDay } from './store';

interface Row {
  date: string;
  work_load: number;
  work_index: number;
  training_load: number;
  training_feel: number;
  sleep: number;
  verdict: Verdict | null;
  readiness: number | null;
  feel_rating: FeelRating | null;
}

export const supabaseDayStore: DayStore = {
  async days(email, since, until) {
    const { data, error } = await supabaseAdmin
      .from('day_inputs')
      .select(
        'date, work_load, work_index, training_load, training_feel, sleep, verdict, readiness, feel_rating'
      )
      .eq('user_email', email)
      .gte('date', since)
      .lte('date', until)
      .order('date', { ascending: true });
    if (error) throw new Error(`day_inputs read failed: ${error.message}`);
    return ((data ?? []) as Row[]).map(
      (r): StoredDay => ({
        date: r.date,
        workLoad: r.work_load,
        workIndex: r.work_index,
        trainingLoad: r.training_load,
        trainingFeel: r.training_feel,
        sleep: r.sleep,
        verdict: r.verdict ?? undefined,
        readiness: r.readiness ?? undefined,
        feelRating: r.feel_rating,
      })
    );
  },
  async saveDay(email, row, source) {
    const { error } = await supabaseAdmin.from('day_inputs').upsert(
      {
        user_email: email,
        date: row.date,
        work_load: row.workLoad,
        work_index: row.workIndex,
        training_load: row.trainingLoad,
        training_feel: row.trainingFeel,
        sleep: row.sleep,
        verdict: row.verdict ?? null,
        readiness: row.readiness ?? null,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,date' }
    );
    if (error) throw new Error(`day_inputs write failed: ${error.message}`);
  },
  async rate(email, date, rating) {
    const { data, error } = await supabaseAdmin
      .from('day_inputs')
      .update({ feel_rating: rating, rated_at: new Date().toISOString() })
      .eq('user_email', email)
      .eq('date', date)
      .select('date');
    if (error) throw new Error(`day_inputs rating failed: ${error.message}`);
    return (data ?? []).length > 0;
  },
};
