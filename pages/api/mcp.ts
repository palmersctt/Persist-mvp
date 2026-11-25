import type { NextApiRequest, NextApiResponse } from 'next';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticate } from '../../src/lib/assistant/auth';
import { createPersistServer } from '../../src/lib/assistant/mcpServer';
import { supabaseDayStore } from '../../src/lib/assistant/supabaseStore';
import { baseUrl } from '../../src/lib/assistant/oauth';

// Persist's MCP endpoint (Streamable HTTP, stateless, JSON responses).
// Authenticate with Authorization: Bearer pst_… — a personal access token
// from the dashboard, or one issued by the OAuth flow (/api/oauth/*).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST (stateless MCP over Streamable HTTP)' });
  }
  const auth = await authenticate(req.headers.authorization);
  if (!auth.ok) {
    // Points OAuth-capable clients at the authorization server (RFC 9728).
    if (auth.status === 401) {
      const base = baseUrl(process.env.NEXTAUTH_URL, req.headers.host);
      res.setHeader(
        'WWW-Authenticate',
        `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`
      );
    }
    return res.status(auth.status).json({ error: auth.error });
  }

  const server = createPersistServer(supabaseDayStore, auth.email);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('mcp request failed:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal error' });
  }
}
