import type { NextApiRequest, NextApiResponse } from 'next';
import { authServerMetadata, baseUrl } from '../../../src/lib/assistant/oauth';

// Served at /.well-known/oauth-authorization-server (see next.config.js).
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(authServerMetadata(baseUrl(process.env.NEXTAUTH_URL, req.headers.host)));
}
