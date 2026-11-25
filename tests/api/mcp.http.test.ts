// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'http';
import type { AddressInfo } from 'net';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

vi.mock('../../lib/supabase', () => ({
  supabaseAdmin: {
    from: () => {
      const q: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'update']) q[m] = () => q;
      q.maybeSingle = () =>
        Promise.resolve({
          data: {
            id: 't',
            user_email: 'me@example.com',
            revoked_at: null,
            window_start: null,
            window_calls: 0,
          },
          error: null,
        });
      q.then = (resolve: (v: unknown) => unknown) => resolve({ data: null, error: null });
      return q;
    },
  },
}));

import handler from '../../pages/api/mcp';

// A tiny stand-in for Next's API runtime: parse JSON, add status()/json().
let server: Server;
let url: string;
beforeAll(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const r = Object.assign(req, {
        body: body ? JSON.parse(body) : undefined,
      }) as unknown as NextApiRequest;
      const s = Object.assign(res, {
        status(code: number) {
          res.statusCode = code;
          return s;
        },
        json(v: unknown) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(v));
          return s;
        },
      }) as unknown as NextApiResponse;
      handler(r, s);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/mcp`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('/api/mcp over HTTP', () => {
  it('lets an MCP client with a token list the tools', async () => {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { Authorization: 'Bearer pst_test' } },
    });
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toContain('log_day');
    await client.close();
  });
});
