'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import PersistLogo from '../../../src/components/PersistLogo';

// The consent screen an assistant sends you to when you connect Persist.
function Consent() {
  const search = useSearchParams();
  const params = useMemo(() => search ?? new URLSearchParams(), [search]);
  const { status } = useSession();
  const [client, setClient] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clientId = params.get('client_id') ?? '';
  const redirectUri = params.get('redirect_uri') ?? '';

  useEffect(() => {
    if (status === 'unauthenticated') signIn('google', { callbackUrl: window.location.href });
    if (status !== 'authenticated') return;
    if (params.get('response_type') !== 'code')
      return setProblem('This connection link is incomplete.');
    fetch(
      `/api/oauth/approve?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    )
      .then(async (r) => {
        if (!r.ok) return setProblem('Unknown app.');
        const d = await r.json();
        setClient(d.client_name);
        setHost(d.redirect_host ?? null);
      })
      .catch(() => setProblem('Persist could not check this app right now.'));
  }, [status, params, clientId, redirectUri]);

  const answer = async (approve: boolean) => {
    setBusy(true);
    const r = await fetch('/api/oauth/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approve,
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: params.get('code_challenge'),
        code_challenge_method: params.get('code_challenge_method'),
        state: params.get('state') ?? undefined,
      }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (d.redirect) window.location.href = d.redirect;
    else {
      setProblem('Something went wrong. Try connecting again.');
      setBusy(false);
    }
  };

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-6"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
    >
      <PersistLogo />
      {problem ? (
        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {problem}
        </p>
      ) : !client ? (
        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Checking…
        </p>
      ) : (
        <>
          <h1 className="mt-6 text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Connect <span style={{ color: 'var(--signal)' }}>{client}</span> to Persist?
          </h1>
          {host && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              It will send you back to <span style={{ color: 'var(--text)' }}>{host}</span>. Only
              allow it if you started this from that app.
            </p>
          )}
          <ul
            className="mt-4 text-sm leading-relaxed flex flex-col gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <li>It can send your day’s meeting times and counts, and get your verdict back.</li>
            <li>It can read your recent verdicts and record how a day felt.</li>
            <li>Persist stores numbers only — never meeting titles or content.</li>
            <li>Revoke it any time under Connected assistants on your dashboard.</li>
          </ul>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => answer(true)}
              className="flex-1 rounded-lg py-3 text-sm font-semibold"
              style={{ backgroundColor: 'var(--signal)', color: 'var(--ground)' }}
            >
              Allow
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => answer(false)}
              className="flex-1 rounded-lg py-3 text-sm"
              style={{ border: '1px solid var(--rule)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--ground)' }}
    >
      <Suspense fallback={null}>
        <Consent />
      </Suspense>
    </main>
  );
}
