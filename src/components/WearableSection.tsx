'use client';

import { useEffect, useState } from 'react';
import type { WearableHook } from '../hooks/useWearable';
import type { DashboardVerdict } from '../lib/dashboardModel';
import { trackEvent } from '../lib/trackEvent';
import ReadinessExplain from './ReadinessExplain';

// Wearable surface for the dashboard: the connect pitch when no activity
// provider is linked, otherwise the panel that EXPLAINS the card's verdict
// (the same unified model — never a second, competing readiness number).
export default function WearableSection({
  model,
  wearable,
}: {
  model: DashboardVerdict | null;
  wearable: WearableHook;
}) {
  const { connected, provider, actuals, available, isLoading, connect, connectDemo, disconnect } =
    wearable;
  const [notice, setNotice] = useState<string | null>(null);
  const [demoConnecting, setDemoConnecting] = useState(false);

  // Surface the OAuth redirect outcome once, then clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('wearable');
    if (!result) return;
    if (result === 'whoop-unavailable') {
      setNotice('WHOOP isn’t configured in this environment yet — try demo data.');
    } else if (result === 'denied') {
      setNotice('The connection was declined. You can try again anytime.');
    } else if (result === 'error') {
      setNotice('Something went wrong connecting WHOOP. Try again.');
    }
    params.delete('wearable');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  if (isLoading) return null;

  // --- Not connected: the verdict already reads your calendar; WHOOP sharpens it ---
  if (!connected) {
    return (
      <section className="max-w-xs mx-auto w-full">
        <h2
          className="text-[11px] font-bold uppercase mb-3"
          style={{ letterSpacing: '0.12em', color: 'var(--text-faint)' }}
        >
          Sharpen your readiness
        </h2>
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
            Add your body and training.
          </p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Your verdict above reads your calendar today. Connect WHOOP and Persistwork weighs how
            you slept and what you&apos;re built for against what you&apos;ve done lately &mdash; so
            the call knows the difference between a hard week and being off the couch.
          </p>
          {notice && (
            <p className="text-xs mb-3" style={{ color: 'var(--signal-dim)' }}>
              {notice}
            </p>
          )}
          <button
            onClick={() => {
              if (!available.whoop) return;
              trackEvent('wearable_connect_clicked', { provider: 'whoop' });
              connect('whoop');
            }}
            disabled={!available.whoop}
            className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors mb-2"
            style={
              available.whoop
                ? {
                    backgroundColor: 'var(--signal)',
                    color: 'var(--ground)',
                    border: 'none',
                    cursor: 'pointer',
                  }
                : {
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text-faint)',
                    border: '1px solid var(--rule)',
                    cursor: 'not-allowed',
                  }
            }
          >
            Connect WHOOP
          </button>
          {!available.whoop && (
            <p className="text-[10px] mb-2 text-center" style={{ color: 'var(--text-faint)' }}>
              WHOOP isn&apos;t configured in this environment yet &mdash; preview with demo data
              below.
            </p>
          )}
          <button
            onClick={async () => {
              trackEvent('wearable_connect_clicked', { provider: 'demo' });
              setDemoConnecting(true);
              const err = await connectDemo();
              setDemoConnecting(false);
              if (err) setNotice(err);
            }}
            disabled={demoConnecting}
            className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--rule)',
              cursor: demoConnecting ? 'wait' : 'pointer',
              opacity: demoConnecting ? 0.6 : 1,
            }}
          >
            {demoConnecting ? 'Connecting demo data…' : 'Preview with demo data'}
          </button>
        </div>
      </section>
    );
  }

  // --- Connected: explain the card's verdict (the same model) ---
  const providerName = provider === 'whoop' ? 'WHOOP' : provider;
  const providerLabel = provider === 'demo' ? 'Demo data' : (providerName ?? undefined);

  return (
    <section className="max-w-xs mx-auto w-full">
      {model && <ReadinessExplain model={model} providerLabel={providerLabel} body={actuals} />}

      <div className="text-center mt-5">
        <button
          onClick={() => {
            trackEvent('wearable_disconnected', { provider: provider ?? 'unknown' });
            disconnect();
          }}
          className="text-[10px] font-medium transition-opacity hover:opacity-70"
          style={{
            color: 'var(--text-faint)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Disconnect {provider === 'demo' ? 'demo data' : providerName}
        </button>
      </div>
    </section>
  );
}
