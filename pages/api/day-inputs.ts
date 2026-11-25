import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { supabaseAdmin } from '../../lib/supabase';
import { HISTORY_WINDOW_DAYS, parseDayRow, type DayRow } from '../../src/lib/engine/history';

// The signed-in user's per-day model inputs (the engine's history).
//   GET  ?days=42&timezone=…  → { rows: DayRow[], available }
//   POST { date, workLoad, workIndex, trainingLoad, trainingFeel, sleep }
//        today's row only (local date in `timezone`) → { stored }
// Fails soft: if the table isn't there yet, GET returns no rows and POST
// reports stored: false, so the dashboard keeps working.

const COLUMNS = 'date, work_load, work_index, training_load, training_feel, sleep';

interface DbRow {
  date: string;
  work_load: number;
  work_index: number;
  training_load: number;
  training_feel: number;
  sleep: number;
}

const fromDb = (r: DbRow): DayRow => ({
  date: r.date,
  workLoad: r.work_load,
  workIndex: r.work_index,
  trainingLoad: r.training_load,
  trainingFeel: r.training_feel,
  sleep: r.sleep,
});

function localToday(tz: unknown): string {
  const zone = typeof tz === 'string' && tz ? tz : 'America/Los_Angeles';
  try {
    return new Date().toLocaleDateString('sv-SE', { timeZone: zone });
  } catch {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Los_Angeles' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return res.status(401).json({ error: 'Unauthorized - Please sign in' });

  const tz = req.query.timezone ?? req.headers['x-user-timezone'];
  const today = localToday(tz);

  if (req.method === 'GET') {
    const asked = Number(req.query.days);
    const days =
      Number.isFinite(asked) && asked > 0
        ? Math.min(asked, HISTORY_WINDOW_DAYS)
        : HISTORY_WINDOW_DAYS;
    const since = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await supabaseAdmin
      .from('day_inputs')
      .select(COLUMNS)
      .eq('user_email', email)
      .gte('date', since)
      .lt('date', today)
      .order('date', { ascending: true });
    if (error) {
      console.error('day-inputs read failed:', error.message);
      return res.status(200).json({ rows: [], available: false });
    }
    return res.status(200).json({ rows: (data ?? []).map(fromDb), available: true });
  }

  const parsed = parseDayRow(req.body, today);
  if (!parsed.ok) return res.status(400).json({ errors: parsed.errors });
  const r = parsed.row;
  const { error } = await supabaseAdmin.from('day_inputs').upsert(
    {
      user_email: email,
      date: r.date,
      work_load: r.workLoad,
      work_index: r.workIndex,
      training_load: r.trainingLoad,
      training_feel: r.trainingFeel,
      sleep: r.sleep,
      source: 'dashboard',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_email,date' }
  );
  if (error) {
    console.error('day-inputs write failed:', error.message);
    return res.status(202).json({ stored: false });
  }
  return res.status(200).json({ stored: true });
}
