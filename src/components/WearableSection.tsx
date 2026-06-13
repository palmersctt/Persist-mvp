'use client';

import { useEffect, useMemo, useState } from 'react';
import type { WearableHook } from '../hooks/useWearable';
import {
  computeReadiness,
  readinessContributions,
  type DayShape,
  type ForecastScores,
  type MetricKey,
} from '../lib/readiness';
import { trackEvent } from '../lib/trackEvent';
import ReadinessBreakdown from './ReadinessBreakdown';

// Wearable surface for the dashboard: the connect pitch when no wearable is
// linked, otherwise the readiness breakdown that explains the card's number.
export default function WearableSection({
  forecast,
  dayShape,
  wearable,
  onMetricClick,
}: {
  forecast: ForecastScores;
  dayShape: DayShape | null;
  wearable: WearableHook;
  onMetricClick?: (metric: MetricKey) => void;
}) {
  const { connected, provider, actuals, available, isLoading, connect, connectDemo, disconnect } =
    wearable;
  const [notice, setNotice] = useState<string | null>(null);
  const [demoConnecting, setDemoConnecting] = useState(false);

  // Tick every 30s so the countdown to "clear" stays honest
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Surface the OAuth redirect outcome once, then clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('wearable');
    if (!result) return;
    if (result === 'whoop-unavailable') {
      setNotice('WHOOP isn’t configured in this environment yet — try demo data.');
    } else if (result === 'strava-unavailable') {
      setNotice('Strava isn’t configured in this environment yet — try demo data.');
    } else if (result === 'denied') {
      setNotice('The connection was declined. You can try again anytime.');
    } else if (result === 'error') {
      setNotice('Something went wrong connecting your wearable. Try again.');
    }
    params.delete('wearable');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  const state = useMemo(
    () => computeReadiness(now, dayShape, forecast, actuals),
    [now, dayShape, forecast, actuals]
  );

  if (isLoading) return null;

  // --- Not connected: the pitch + connect actions ---
  if (!connected) {
    return (
      <section className="max-w-xs mx-auto w-full">
        <h2
          className="text-[11px] font-bold uppercase mb-3"
          style={{ letterSpacing: '0.12em', color: 'var(--text-faint)' }}
        >
          Forecast vs Actual
        </h2>
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
            Your calendar is the forecast. Your training is the actual.
          </p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Connect Strava and Persistwork turns your recent training into freshness, then fuses it
            with your Focus, Strain, and Balance scores into one number &mdash; readiness &mdash; so
            whether you train at 6am or 6pm, you know how hard to go.
          </p>
          {notice && (
            <p className="text-xs mb-3" style={{ color: 'var(--signal-dim)' }}>
              {notice}
            </p>
          )}
          <button
            onClick={() => {
              if (!available.strava) return;
              trackEvent('wearable_connect_clicked', { provider: 'strava' });
              connect('strava');
            }}
            disabled={!available.strava}
            className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors mb-2"
            style={
              available.strava
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
            Connect Strava
          </button>
          {!available.strava && (
            <p className="text-[10px] mb-2 text-center" style={{ color: 'var(--text-faint)' }}>
              Strava isn&apos;t configured in this environment yet &mdash; preview with demo data
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

  // --- Connected: the readiness breakdown explains the card's number ---
  const contributions = readinessContributions(forecast, actuals);
  const providerLabel = provider === 'demo' ? 'Demo data' : (provider ?? undefined);

  return (
    <section className="max-w-xs mx-auto w-full">
      <ReadinessBreakdown
        state={state}
        contributions={contributions}
        connected={connected}
        providerLabel={providerLabel}
        onMetricClick={onMetricClick}
      />

      <div className="text-center mt-4">
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
          Disconnect {provider === 'demo' ? 'demo data' : provider}
        </button>
      </div>
    </section>
  );
}
