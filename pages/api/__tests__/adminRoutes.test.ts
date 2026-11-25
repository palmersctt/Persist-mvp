import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const getServerSession = vi.fn();
vi.mock('next-auth/next', () => ({
  getServerSession: (...a: unknown[]) => getServerSession(...a),
}));
vi.mock('../auth/[...nextauth]', () => ({ authOptions: {} }));

// A chainable Supabase query stub that resolves to { data, error }.
const rows = [{ id: 1, email: 'someone@else.com', created_at: '2026-11-01' }];
const query = () => {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'gte', 'lte', 'insert']) q[m] = vi.fn(() => q);
  q.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
  return q;
};
vi.mock('../../../lib/supabase', () => ({ supabaseAdmin: { from: vi.fn(() => query()) } }));
vi.mock('../../../src/services/claudeAI', () => ({
  default: class {
    getHealthStatus() {
      return 'healthy';
    }
  },
}));

import usersHandler from '../analytics/users';
import eventsHandler from '../analytics/events';
import aiHealthHandler from '../ai-health';

function call(
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown,
  req: Partial<NextApiRequest>
) {
  const out: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      out.status = code;
      return this;
    },
    json(body: unknown) {
      out.body = body;
      return this;
    },
  } as unknown as NextApiResponse;
  return Promise.resolve(
    handler({ method: 'GET', query: {}, body: {}, ...req } as NextApiRequest, res)
  ).then(() => out);
}

describe('cross-user analytics routes', () => {
  const saved = process.env.ADMIN_EMAILS;
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@persistwork.com';
    getServerSession.mockReset();
  });
  afterEach(() => {
    process.env.ADMIN_EMAILS = saved;
  });

  for (const [name, handler] of [
    ['GET /api/analytics/users', usersHandler],
    ['GET /api/analytics/events', eventsHandler],
  ] as const) {
    it(`${name}: no session → 401`, async () => {
      getServerSession.mockResolvedValue(null);
      expect((await call(handler, {})).status).toBe(401);
    });

    it(`${name}: ordinary user → 403, no data`, async () => {
      getServerSession.mockResolvedValue({ user: { email: 'user@example.com' } });
      const out = await call(handler, {});
      expect(out.status).toBe(403);
      expect(JSON.stringify(out.body)).not.toContain('someone@else.com');
    });

    it(`${name}: admin → 200`, async () => {
      getServerSession.mockResolvedValue({ user: { email: 'Admin@persistwork.com' } });
      expect((await call(handler, {})).status).toBe(200);
    });
  }

  it('POST /api/analytics/events still accepts a signed-in user', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    const out = await call(eventsHandler, {
      method: 'POST',
      body: { eventType: 'card_swipe', metadata: {} },
    });
    // The insert stub resolves without error.
    expect(out.status).toBe(201);
  });
});

describe('GET /api/ai-health', () => {
  it('reports key presence but no part of the key', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-secret-value';
    const out = await call(aiHealthHandler, {});
    const text = JSON.stringify(out.body);
    expect(text).toContain('"hasAnthropicKey":true');
    expect(text).not.toContain('sk-ant');
    expect(text).not.toMatch(/KeyLength|KeyPrefix/);
  });
});
