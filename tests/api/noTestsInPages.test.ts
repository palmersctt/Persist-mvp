// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Next.js treats every file under pages/ as a route; a test file there
// breaks `next build`. Route tests live in tests/api/.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('pages/', () => {
  it('holds no test files', () => {
    expect(walk(join(process.cwd(), 'pages')).filter((p) => /\.test\.|__tests__/.test(p))).toEqual(
      []
    );
  });
});
