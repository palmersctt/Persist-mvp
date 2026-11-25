import { describe, it, expect } from 'vitest';
import { isAdmin } from './admin';

describe('isAdmin', () => {
  it('matches a listed email, ignoring case and spaces', () => {
    expect(isAdmin('Ops@Example.com', ' a@x.com, ops@example.com ')).toBe(true);
  });
  it('rejects unlisted emails', () => {
    expect(isAdmin('b@x.com', 'a@x.com')).toBe(false);
  });
  it('treats an unset or empty list as nobody', () => {
    expect(isAdmin('a@x.com', undefined)).toBe(false);
    expect(isAdmin('a@x.com', '')).toBe(false);
    expect(isAdmin('a@x.com', ' , ')).toBe(false);
  });
  it('rejects a missing email', () => {
    expect(isAdmin(undefined, 'a@x.com')).toBe(false);
    expect(isAdmin('', 'a@x.com')).toBe(false);
  });
});
