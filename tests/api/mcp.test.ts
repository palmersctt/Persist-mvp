import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

let tokenRow: unknown = null;
const updates: unknown[] = [];
vi.mock('../../lib/supabase', () => ({
  supabaseAdmin: {
    from: () => {
      const q: Record<string, unknown> = {};
      for (const m of ['select', 'eq']) q[m] = () => q;
      q.maybeSingle = () => Promise.resolve({ data: tokenRow, error: null });
      q.update = (v: unknown) => {
        updates.push(v);
        return q;
      };
      q.then = (resolve: (v: unknown) => unknown) => resolve({ data: null, error: null });
      return q;
    },
  },
}));

import handler from '../../pages/api/mcp';

function call(req: Partial<NextApiRequest>) {
  const out: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const res = {
    setHeader(k: string, v: string) {
      out.headers[k] = v;
    },
    status(code: number) {
      out.status = code;
      return this;
    },
    json(body: unknown) {
      out.body = body;
      return this;
    },
    on() {},
  } as unknown as NextApiResponse;
  return Promise.resolve(
    handler({ method: 'POST', headers: {}, body: {}, ...req } as NextApiRequest, res)
  ).then(() => out);
}

describe('/api/mcp auth', () => {
  beforeEach(() => {
    tokenRow = null;
    updates.length = 0;
  });

  it('is POST only', async () => {
    expect((await call({ method: 'GET' })).status).toBe(405);
  });

  it('needs a bearer token', async () => {
    const out = await call({});
    expect(out.status).toBe(401);
    expect(out.headers['WWW-Authenticate']).toBe('Bearer');
  });

  it('rejects unknown and revoked tokens', async () => {
    expect((await call({ headers: { authorization: 'Bearer pst_nope' } })).status).toBe(401);
    tokenRow = {
      id: 't',
      user_email: 'me@example.com',
      revoked_at: '2026-11-01',
      window_start: null,
      window_calls: 0,
    };
    expect((await call({ headers: { authorization: 'Bearer pst_x' } })).status).toBe(401);
  });

  it('rate-limits at 60 calls an hour', async () => {
    tokenRow = {
      id: 't',
      user_email: 'me@example.com',
      revoked_at: null,
      window_start: new Date().toISOString(),
      window_calls: 60,
    };
    expect((await call({ headers: { authorization: 'Bearer pst_x' } })).status).toBe(429);
    expect(updates).toHaveLength(0);
  });
});
