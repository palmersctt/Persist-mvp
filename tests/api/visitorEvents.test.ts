import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const getServerSession = vi.fn();
vi.mock('next-auth/next', () => ({
  getServerSession: (...a: unknown[]) => getServerSession(...a),
}));
vi.mock('../../pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
const inserted: unknown[] = [];
vi.mock('../../lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: (row: unknown) => {
        inserted.push(row);
        return Promise.resolve({ error: null });
      },
    }),
  },
}));

import handler from '../../pages/api/analytics/events';

function post(body: Record<string, unknown>) {
  const out: { status?: number } = {};
  const res = {
    status(code: number) {
      out.status = code;
      return this;
    },
    json() {
      return this;
    },
  } as unknown as NextApiResponse;
  return Promise.resolve(handler({ method: 'POST', body, query: {} } as NextApiRequest, res)).then(
    () => out
  );
}

describe('signed-out funnel events', () => {
  beforeEach(() => {
    inserted.length = 0;
    getServerSession.mockResolvedValue(null);
  });

  it('accepts verdict_* events with a visitor id', async () => {
    const out = await post({
      eventType: 'verdict_scored',
      metadata: { tier: 'ok' },
      visitorId: 'visitor-1-abc',
    });
    expect(out.status).toBe(201);
    expect(inserted[0]).toMatchObject({
      user_email: 'visitor-1-abc',
      event_type: 'verdict_scored',
    });
  });

  it('rejects the old sandbox ids', async () => {
    expect(
      (await post({ eventType: 'verdict_scored', sandboxSessionId: 'sandbox-1-abc' })).status
    ).toBe(401);
  });

  it('does not let visitors log other events or odd ids', async () => {
    expect((await post({ eventType: 'card_share', visitorId: 'visitor-1-abc' })).status).toBe(401);
    expect(
      (await post({ eventType: 'verdict_scored', visitorId: 'someone@example.com' })).status
    ).toBe(401);
    expect(inserted).toHaveLength(0);
  });
});
