// OAuth 2.1 pieces for MCP connectors: metadata, client registration
// checks, redirect safety and PKCE. Pure (Node crypto for hashing).

import { createHash, randomBytes } from 'crypto';

export const SCOPE = 'persist:days';
/** Authorization codes are single-use and short-lived. */
export const CODE_TTL_MS = 5 * 60_000;

/** Where this deployment lives, e.g. https://persistwork.com. */
export function baseUrl(env: string | undefined, host: string | undefined): string {
  const fromEnv = env?.replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  return `https://${host ?? 'localhost'}`;
}

/** RFC 8414 authorization-server metadata. */
export function authServerMetadata(base: string) {
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [SCOPE],
  };
}

/** RFC 9728 protected-resource metadata for the MCP endpoint. */
export function protectedResourceMetadata(base: string) {
  return {
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
  };
}

/** HTTPS anywhere, or plain http only on loopback (desktop clients). */
export function isSafeRedirect(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri.length > 2000) return false;
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.hash) return false;
  if (u.protocol === 'https:') return true;
  return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
}

export type Registration =
  | { ok: true; client_name: string; redirect_uris: string[] }
  | { ok: false; error: string };

/** Validate an RFC 7591 registration request (public clients only). */
export function parseRegistration(raw: unknown): Registration {
  if (typeof raw !== 'object' || raw === null)
    return { ok: false, error: 'invalid_client_metadata' };
  const r = raw as Record<string, unknown>;
  const uris = r.redirect_uris;
  if (!Array.isArray(uris) || uris.length === 0 || uris.length > 10 || !uris.every(isSafeRedirect))
    return { ok: false, error: 'invalid_redirect_uri' };
  const name =
    typeof r.client_name === 'string' && r.client_name.trim()
      ? r.client_name.trim().slice(0, 80)
      : 'Assistant';
  return { ok: true, client_name: name, redirect_uris: uris as string[] };
}

export const newClientId = () => `pc_${randomBytes(16).toString('hex')}`;
export const newCode = () => randomBytes(32).toString('base64url');
export const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

/** PKCE S256: base64url(sha256(verifier)) === challenge. */
export function verifyPkce(verifier: unknown, challenge: string): boolean {
  if (typeof verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  return createHash('sha256').update(verifier).digest('base64url') === challenge;
}

/** A redirect back to the client with the given query parameters. */
export function redirectWith(uri: string, params: Record<string, string | undefined>): string {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, v);
  return u.toString();
}
