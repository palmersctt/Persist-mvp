import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const getServerSession = vi.fn();
vi.mock('next-auth', () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock('../auth/[...nextauth]', () => ({ authOptions: {} }));

// Records every Supabase call; resolves to `result`.
const calls: { method: string; args: unknown[] }[] = [];
let result: { data: unknown; error: unknown } = { data: [], error: null };
const query = () => {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'gte', 'lt', 'order', 'upsert'])
    q[m] = vi.fn((...args: unknown[]) => {
      calls.push({ method: m, args });
      return q;
    });
  q.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return q;
};
vi.mock('../../../lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((t: string) => {
      calls.push({ method: 'from', args: [t] });
      return query();
    }),
  },
}));

import handler from '../day-inputs';

const TZ = 'America/New_York';
const today = new Date().toLocaleDateString('sv-SE', { timeZone: TZ });

function call(req: Partial<NextApiRequest>) {
  const out: { status?: number; body?: Record<string, unknown> } = {};
  const res = {
    status(code: number) {
      out.status = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      out.body = body;
      return this;
    },
  } as unknown as NextApiResponse;
  return Promise.resolve(
    handler(
      { method: 'GET', query: { timezone: TZ }, headers: {}, body: {}, ...req } as NextApiRequest,
      res
    )
  ).then(() => out);
}

const row = {
  date: today,
  workLoad: 44,
  workIndex: 56,
  trainingLoad: 30,
  trainingFeel: 0,
  sleep: 62,
};

describe('/api/day-inputs', () => {
  beforeEach(() => {
    calls.length = 0;
    result = { data: [], error: null };
    getServerSession.mockResolvedValue({ user: { email: 'me@example.com' } });
  });

  it('needs a session', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call({})).status).toBe(401);
  });

  it('GET reads only my rows, before today, and maps them', async () => {
    result = {
      data: [
        {
          date: '2026-11-20',
          work_load: 50,
          work_index: 60,
          training_load: 20,
          training_feel: 0,
          sleep: 70,
        },
      ],
      error: null,
    };
    const out = await call({});
    expect(out.status).toBe(200);
    expect(out.body?.rows).toEqual([
      {
        date: '2026-11-20',
        workLoad: 50,
        workIndex: 60,
        trainingLoad: 20,
        trainingFeel: 0,
        sleep: 70,
      },
    ]);
    expect(calls).toContainEqual({ method: 'eq', args: ['user_email', 'me@example.com'] });
    expect(calls).toContainEqual({ method: 'lt', args: ['date', today] });
  });

  it('GET returns no rows (not an error) when the table is missing', async () => {
    result = { data: null, error: { message: 'relation "day_inputs" does not exist' } };
    const out = await call({});
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ rows: [], available: false });
  });

  it("POST upserts today's row under my email", async () => {
    const out = await call({ method: 'POST', body: row });
    expect(out.body).toEqual({ stored: true });
    const upsert = calls.find((c) => c.method === 'upsert');
    expect(upsert?.args[0]).toMatchObject({
      user_email: 'me@example.com',
      date: today,
      work_load: 44,
    });
  });

  it('POST ignores an email in the body', async () => {
    await call({ method: 'POST', body: { ...row, user_email: 'victim@example.com' } });
    const upsert = calls.find((c) => c.method === 'upsert');
    expect(upsert?.args[0]).toMatchObject({ user_email: 'me@example.com' });
  });

  it('POST rejects any day but today', async () => {
    const out = await call({ method: 'POST', body: { ...row, date: '2020-01-01' } });
    expect(out.status).toBe(400);
    expect(calls.find((c) => c.method === 'upsert')).toBeUndefined();
  });

  it('POST reports stored: false when the table is missing', async () => {
    result = { data: null, error: { message: 'relation "day_inputs" does not exist' } };
    const out = await call({ method: 'POST', body: row });
    expect(out.status).toBe(202);
    expect(out.body).toEqual({ stored: false });
  });
});
