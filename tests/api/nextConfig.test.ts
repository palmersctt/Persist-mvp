// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const config = createRequire(import.meta.url)('../../next.config.js');

describe('next.config.js', () => {
  it('forbids framing every page (clickjacking on the consent screen)', async () => {
    const rules = await config.headers();
    const all = rules.find((r: { source: string }) => r.source === '/:path*');
    expect(all.headers).toEqual(
      expect.arrayContaining([
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      ])
    );
  });

  it('sends old sandbox links, deep ones too, to /verdict', async () => {
    const r = await config.redirects();
    expect(r.map((x: { source: string }) => x.source)).toEqual(['/sandbox', '/sandbox/:path*']);
  });

  it('serves OAuth discovery under /.well-known', async () => {
    const r = await config.rewrites();
    expect(r.map((x: { source: string }) => x.source)).toContain(
      '/.well-known/oauth-protected-resource'
    );
  });
});
