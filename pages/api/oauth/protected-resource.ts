import type { NextApiRequest, NextApiResponse } from 'next';
import { baseUrl, protectedResourceMetadata } from '../../../src/lib/assistant/oauth';

// Served at /.well-known/oauth-protected-resource (see next.config.js).
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res
    .status(200)
    .json(protectedResourceMetadata(baseUrl(process.env.NEXTAUTH_URL, req.headers.host)));
}
