# Questions: auth, API surface and server runtime today

1. How does authentication work end to end (`pages/api/auth/[...nextauth].ts`,
   session strategy, JWT contents, token refresh, `middleware.ts`), and what
   identifies a user across tables?
2. Which API routes exist, which are session-gated, and is there any API
   key, bearer token, or non-browser client authentication anywhere?
3. What runtime do API routes use (Node vs edge), how is the app deployed
   (`vercel.json`, `next.config.js`), and are there any streaming or
   long-lived routes?
4. Which MCP, OAuth-provider, or JSON-RPC related packages are installed
   (`package.json`), if any?
5. What does `src/lib/engine` export, and which parts import browser-only or
   server-only modules?
6. How are secrets and environment variables declared and read
   (`.env*` examples, `debug/env`, docs)?
7. What tables hold per-user state, and how are users created
   (`users` upsert in NextAuth callbacks, `supabase-setup.sql`)?
8. How do the existing tests mock Next API routes, Supabase or sessions, if
   at all?
