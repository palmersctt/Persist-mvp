import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fakeSupabase } from './fakeSupabase';

const db = vi.hoisted(() => ({
  current: null as ReturnType<typeof import('./fakeSupabase').fakeSupabase> | null,
}));
const getServerSession = vi.fn();
vi.mock('next-auth', () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock('../../pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
vi.mock('../../lib/supabase', () => ({
  supabaseAdmin: { from: (t: string) => db.current!.from(t) },
}));

import register from '../../pages/api/oauth/register';
import approve from '../../pages/api/oauth/approve';
import token from '../../pages/api/oauth/token';
import metadata from '../../pages/api/oauth/metadata';
import { authenticate } from '../../src/lib/assistant/auth';

function call(
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown,
  req: Partial<NextApiRequest>
) {
  const out: { status?: number; body?: Record<string, unknown> } = {};
  const res = {
    setHeader() {},
    status(code: number) {
      out.status = code;
      return this;
    },
    json(body: Record<string, unknown>) {
      out.body = body;
      return this;
    },
    end() {
      return this;
    },
  } as unknown as NextApiResponse;
  return Promise.resolve(
    handler(
      {
        method: 'POST',
        query: {},
        headers: { host: 'persist.test' },
        body: {},
        ...req,
      } as NextApiRequest,
      res
    )
  ).then(() => out);
}

const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';
const verifier = 'v'.repeat(50);
const challenge = createHash('sha256').update(verifier).digest('base64url');

async function registerClient() {
  const r = await call(register, { body: { client_name: 'Claude', redirect_uris: [REDIRECT] } });
  return r.body!.client_id as string;
}

async function getCode(clientId: string) {
  const r = await call(approve, {
    body: {
      approve: true,
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'xyz',
    },
  });
  const url = new URL(r.body!.redirect as string);
  return { code: url.searchParams.get('code')!, state: url.searchParams.get('state') };
}

describe('OAuth flow', () => {
  beforeEach(() => {
    db.current = fakeSupabase();
    getServerSession.mockResolvedValue({ user: { email: 'me@example.com' } });
  });

  it('publishes metadata', async () => {
    const r = await call(metadata, { method: 'GET' });
    expect(r.body?.authorization_endpoint).toMatch(/\/oauth\/authorize$/);
  });

  it('register → consent → token → MCP auth', async () => {
    const clientId = await registerClient();
    const { code, state } = await getCode(clientId);
    expect(state).toBe('xyz');

    const t = await call(token, {
      body: {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        redirect_uri: REDIRECT,
        code_verifier: verifier,
      },
    });
    expect(t.status).toBe(200);
    const access = t.body!.access_token as string;
    expect(access.startsWith('pst_')).toBe(true);
    expect(db.current!.tables.api_tokens[0]).toMatchObject({
      user_email: 'me@example.com',
      label: 'Claude',
    });

    const auth = await authenticate(`Bearer ${access}`);
    expect(auth).toEqual({ ok: true, email: 'me@example.com' });
  });

  it('a code works once', async () => {
    const clientId = await registerClient();
    const { code } = await getCode(clientId);
    const body = {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_verifier: verifier,
    };
    expect((await call(token, { body })).status).toBe(200);
    expect((await call(token, { body })).body).toEqual({ error: 'invalid_grant' });
  });

  it('rejects a wrong verifier, client or redirect', async () => {
    const clientId = await registerClient();
    const { code } = await getCode(clientId);
    const base = {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_verifier: verifier,
    };
    for (const patch of [
      { code_verifier: 'w'.repeat(50) },
      { client_id: 'pc_other' },
      { redirect_uri: 'https://claude.ai/other' },
    ])
      expect((await call(token, { body: { ...base, ...patch } })).body).toEqual({
        error: 'invalid_grant',
      });
  });

  it('never redirects to an unregistered address', async () => {
    const clientId = await registerClient();
    const r = await call(approve, {
      body: {
        approve: true,
        client_id: clientId,
        redirect_uri: 'https://evil.example/cb',
        code_challenge: challenge,
        code_challenge_method: 'S256',
      },
    });
    expect(r.status).toBe(400);
    expect(r.body?.redirect).toBeUndefined();
  });

  it('denial and missing PKCE go back as errors', async () => {
    const clientId = await registerClient();
    const deny = await call(approve, {
      body: { approve: false, client_id: clientId, redirect_uri: REDIRECT, state: 's' },
    });
    expect(deny.body?.redirect).toBe(`${REDIRECT}?error=access_denied&state=s`);
    const plain = await call(approve, {
      body: {
        approve: true,
        client_id: clientId,
        redirect_uri: REDIRECT,
        code_challenge: 'x',
        code_challenge_method: 'plain',
      },
    });
    expect(plain.body?.redirect).toMatch(/error=invalid_request/);
  });

  it('consent needs a signed-in user', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call(approve, { method: 'GET' })).status).toBe(401);
  });

  it('rejects unsafe registrations', async () => {
    const r = await call(register, { body: { redirect_uris: ['http://evil.example/cb'] } });
    expect(r.body).toEqual({ error: 'invalid_redirect_uri' });
  });
});
