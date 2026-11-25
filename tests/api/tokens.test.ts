import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const getServerSession = vi.fn();
vi.mock('next-auth', () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock('../../pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));

const calls: { method: string; args: unknown[] }[] = [];
let results: { data: unknown; error: unknown }[] = [];
const query = () => {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'is', 'order', 'insert', 'update', 'single'])
    q[m] = vi.fn((...args: unknown[]) => {
      calls.push({ method: m, args });
      return q;
    });
  q.then = (resolve: (v: unknown) => unknown) =>
    resolve(results.shift() ?? { data: [], error: null });
  return q;
};
vi.mock('../../lib/supabase', () => ({ supabaseAdmin: { from: vi.fn(() => query()) } }));

import handler from '../../pages/api/tokens';
import { hashToken } from '../../src/lib/assistant/tokens';

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
    handler({ method: 'GET', query: {}, headers: {}, body: {}, ...req } as NextApiRequest, res)
  ).then(() => out);
}

describe('/api/tokens', () => {
  beforeEach(() => {
    calls.length = 0;
    results = [];
    getServerSession.mockResolvedValue({ user: { email: 'me@example.com' } });
  });

  it('needs a session', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call({})).status).toBe(401);
  });

  it('lists only my active tokens', async () => {
    results = [{ data: [{ id: 't1', label: 'Claude' }], error: null }];
    const out = await call({});
    expect(out.body?.tokens).toEqual([{ id: 't1', label: 'Claude' }]);
    expect(calls).toContainEqual({ method: 'eq', args: ['user_email', 'me@example.com'] });
    expect(calls).toContainEqual({ method: 'is', args: ['revoked_at', null] });
    expect(JSON.stringify(calls)).not.toContain('token_hash');
  });

  it('creates a token, returns it once, stores only its hash', async () => {
    results = [
      { data: [], error: null },
      { data: { id: 't2' }, error: null },
    ];
    const out = await call({ method: 'POST', body: { label: ' Claude ' } });
    expect(out.status).toBe(201);
    const token = out.body?.token as string;
    expect(token.startsWith('pst_')).toBe(true);
    const insert = calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toEqual({
      user_email: 'me@example.com',
      label: 'Claude',
      token_hash: hashToken(token),
    });
    expect(JSON.stringify(insert?.args)).not.toContain(token);
  });

  it('needs a label and caps active tokens', async () => {
    expect((await call({ method: 'POST', body: {} })).status).toBe(400);
    results = [{ data: Array.from({ length: 10 }, (_, i) => ({ id: `${i}` })), error: null }];
    expect((await call({ method: 'POST', body: { label: 'x' } })).status).toBe(409);
  });

  it('revokes only my own token', async () => {
    const out = await call({ method: 'DELETE', query: { id: 't1' } });
    expect(out.body).toEqual({ revoked: true });
    expect(calls).toContainEqual({ method: 'eq', args: ['id', 't1'] });
    expect(calls).toContainEqual({ method: 'eq', args: ['user_email', 'me@example.com'] });
  });
});
