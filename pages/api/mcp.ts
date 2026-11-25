import type { NextApiRequest, NextApiResponse } from 'next';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticate } from '../../src/lib/assistant/auth';
import { createPersistServer } from '../../src/lib/assistant/mcpServer';
import { supabaseDayStore } from '../../src/lib/assistant/supabaseStore';

// Persist's MCP endpoint (Streamable HTTP, stateless, JSON responses).
// Authenticate with a personal access token: Authorization: Bearer pst_…
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST (stateless MCP over Streamable HTTP)' });
  }
  const auth = await authenticate(req.headers.authorization);
  if (!auth.ok) {
    if (auth.status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
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
