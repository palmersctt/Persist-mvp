import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import {
  authServerMetadata,
  baseUrl,
  isSafeRedirect,
  parseRegistration,
  protectedResourceMetadata,
  redirectWith,
  verifyPkce,
} from './oauth';

describe('oauth helpers', () => {
  it('describes the server', () => {
    const m = authServerMetadata('https://persist.test');
    expect(m.code_challenge_methods_supported).toEqual(['S256']);
    expect(m.token_endpoint).toBe('https://persist.test/api/oauth/token');
    expect(protectedResourceMetadata('https://persist.test').resource).toBe(
      'https://persist.test/api/mcp'
    );
    expect(baseUrl('https://persist.test/', 'x')).toBe('https://persist.test');
    expect(baseUrl(undefined, 'h.example')).toBe('https://h.example');
  });

  it.each([
    ['https://claude.ai/api/mcp/auth_callback', true],
    ['http://localhost:6274/callback', true],
    ['http://127.0.0.1:33418', true],
    ['http://evil.example/cb', false],
    ['javascript:alert(1)', false],
    ['https://x.example/cb#frag', false],
    ['not a url', false],
  ])('redirect %s safe = %s', (uri, safe) => {
    expect(isSafeRedirect(uri)).toBe(safe);
  });

  it('validates registrations', () => {
    expect(
      parseRegistration({ redirect_uris: ['https://a.example/cb'], client_name: ' Claude ' })
    ).toEqual({
      ok: true,
      client_name: 'Claude',
      redirect_uris: ['https://a.example/cb'],
    });
    expect(parseRegistration({ redirect_uris: [] }).ok).toBe(false);
    expect(parseRegistration({ redirect_uris: ['http://evil.example'] }).ok).toBe(false);
    expect(parseRegistration(null).ok).toBe(false);
  });

  it('checks PKCE S256', () => {
    const verifier = 'a'.repeat(43);
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    expect(verifyPkce(verifier, challenge)).toBe(true);
    expect(verifyPkce('b'.repeat(43), challenge)).toBe(false);
    expect(verifyPkce('short', challenge)).toBe(false);
    expect(verifyPkce(undefined, challenge)).toBe(false);
  });

  it('builds redirects', () => {
    expect(redirectWith('https://a.example/cb?x=1', { code: 'c', state: 's', no: undefined })).toBe(
      'https://a.example/cb?x=1&code=c&state=s'
    );
  });
});
