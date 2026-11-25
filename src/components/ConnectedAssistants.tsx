'use client';

import { useCallback, useEffect, useState } from 'react';

interface TokenRow {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
}

const SURFACE = { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' } as const;

// Dashboard section: create, copy (once) and revoke the tokens assistants use
// to call Persist's MCP server.
export default function ConnectedAssistants() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [available, setAvailable] = useState(true);
  const [label, setLabel] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/tokens', { cache: 'no-cache' });
      if (!r.ok) return;
      const d = await r.json();
      setTokens(Array.isArray(d.tokens) ? d.tokens : []);
      setAvailable(d.available !== false);
    } catch {
      // keep what we had
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setError(null);
    const r = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label || 'Assistant' }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) return setError(d.error ?? 'Could not create a token right now.');
    setFresh(d.token);
    setCopied(false);
    setLabel('');
    load();
  };

  const revoke = async (id: string) => {
    await fetch(`/api/tokens?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    load();
  };

  const copy = async () => {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="max-w-xs mx-auto mt-8" aria-labelledby="assistants-title">
      <div className="rounded-xl px-4 py-4" style={SURFACE}>
        <h2
          id="assistants-title"
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--signal)' }}
        >
          Connected assistants
        </h2>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Let Claude, ChatGPT or Copilot send your day to Persist and get your verdict back. Meeting
          times and counts only — never titles or content.
        </p>

        {!available ? (
          <p className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
            Coming soon.
          </p>
        ) : (
          <>
            {fresh && (
              <div
                className="mt-3 rounded-lg p-3"
                style={{ border: '1px solid var(--signal-edge)' }}
              >
                <p className="text-[11px]" style={{ color: 'var(--text)' }}>
                  Copy this now — it won’t be shown again.
                </p>
                <code
                  className="block mt-2 text-[10px] break-all"
                  style={{ color: 'var(--signal)', fontFamily: 'var(--font-geist-mono)' }}
                >
                  {fresh}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="mt-2 text-[11px] font-semibold"
                  style={{ color: 'var(--signal)' }}
                >
                  {copied ? 'Copied' : 'Copy token'}
                </button>
              </div>
            )}

            <ul className="mt-3 flex flex-col gap-2">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text)' }}>
                    {t.label}
                    <span className="ml-2" style={{ color: 'var(--text-faint)' }}>
                      {t.last_used_at ? 'used' : 'not used yet'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => revoke(t.id)}
                    className="text-[11px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name, e.g. Claude"
                aria-label="Token name"
                maxLength={60}
                className="flex-1 rounded-lg px-3 py-2 text-xs bg-transparent"
                style={{ border: '1px solid var(--rule)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={create}
                className="rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ backgroundColor: 'var(--signal)', color: 'var(--ground)' }}
              >
                New token
              </button>
            </div>
            {error && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
