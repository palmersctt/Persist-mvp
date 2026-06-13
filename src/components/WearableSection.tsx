'use client';

import { useEffect, useMemo, useState } from 'react';
import type { WearableHook } from '../hooks/useWearable';
import {
  computeReadiness,
  forecastVsActual,
  type DayShape,
  type ForecastScores,
  type ReadinessState,
} from '../lib/readiness';
import { trackEvent } from '../lib/trackEvent';
import type { WearableActuals } from '../lib/wearables/types';

const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

const PHASE_LABELS: Record<ReadinessState['phase'], string> = {
  morning: 'Morning window',
  workday: 'Mid-workday',
  clear: 'Workday clear',
};

/**
 * Presentational readiness panel + actuals row. Shared between the
 * authenticated dashboard (live data via useWearable) and the public
 * sandbox preview (synthetic scenarios).
 */
export function WearablePanel({
  state,
  actuals,
  insight,
  stale = false,
}: {
  state: ReadinessState;
  actuals: WearableActuals | null;
  insight: string | null;
  stale?: boolean;
}) {
  const celebrate = state.phase === 'clear' && state.band === 'prime';
  const metrics: { label: string; value: string }[] = actuals
    ? [
        ...(actuals.recovery != null ? [{ label: 'Recovery', value: `${actuals.recovery}%` }] : []),
        ...(actuals.sleepHours != null
          ? [{ label: 'Sleep', value: `${actuals.sleepHours}h` }]
          : []),
        ...(actuals.hrvMs != null ? [{ label: 'HRV', value: `${actuals.hrvMs}ms` }] : []),
        ...(actuals.restingHr != null ? [{ label: 'RHR', value: `${actuals.restingHr}` }] : []),
        ...(actuals.weekActivityCount != null
          ? [{ label: 'This week', value: `${actuals.weekActivityCount}` }]
          : []),
        ...(actuals.lastActivity != null
          ? [{ label: 'Last out', value: `${actuals.lastActivity.durationMin}m` }]
          : []),
      ]
    : [];

  return (
    <>
      {/* Readiness: body capacity taxed by the workday in real time */}
      <div
        className="rounded-xl p-5 mb-2.5"
        style={
          celebrate
            ? {
                background: 'linear-gradient(160deg, #C7F95C, #A8DE3F)',
                border: '1px solid var(--signal-dim)',
              }
            : { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }
        }
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: celebrate ? 'rgba(11,11,12,0.75)' : 'var(--signal)',
              boxShadow: celebrate ? 'none' : '0 0 12px rgba(199,249,92,0.35)',
            }}
          />
          <span
            className="text-[10px] font-bold uppercase"
            style={{
              letterSpacing: '0.1em',
              color: celebrate ? 'rgba(11,11,12,0.7)' : 'var(--signal-dim)',
            }}
          >
            {PHASE_LABELS[state.phase]}
          </span>
        </div>
        {state.readinessNow != null && (
          <div className="flex items-baseline gap-2 mb-1.5">
            <span
              className="text-3xl font-bold"
              style={{
                color: celebrate ? 'rgba(11,11,12,0.92)' : 'var(--signal)',
                fontFamily: MONO,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {state.readinessNow}
            </span>
            <span
              className="text-[9px] uppercase tracking-wider font-medium"
              style={{ color: celebrate ? 'rgba(11,11,12,0.55)' : 'var(--text-faint)' }}
            >
              Readiness
            </span>
            {state.phase === 'workday' && state.readinessEndOfDay != null && (
              <span
                className="text-xs font-semibold"
                style={{
                  color: celebrate ? 'rgba(11,11,12,0.7)' : 'var(--text-muted)',
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                → ~{state.readinessEndOfDay} at clear
              </span>
            )}
          </div>
        )}
        <p
          className="text-[15px] font-bold mb-1"
          style={{ color: celebrate ? 'rgba(11,11,12,0.92)' : 'var(--text)' }}
        >
          {state.headline}
        </p>
        <p
          className="text-xs leading-relaxed mb-0"
          style={{ color: celebrate ? 'rgba(11,11,12,0.65)' : 'var(--text-muted)' }}
        >
          {state.detail}
        </p>
      </div>

      {/* Today's actuals */}
      {actuals && (
        <div
          className="rounded-xl px-4 py-3.5 mb-2.5"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
        >
          <div className="flex justify-between">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{
                    color: 'var(--signal)',
                    fontFamily: MONO,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.value}
                </div>
                <div
                  className="text-[9px] uppercase tracking-wider mt-0.5 font-medium"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
          {actuals.lastActivity && (
            <p className="text-[10px] mt-2 mb-0 text-center" style={{ color: 'var(--text-faint)' }}>
              Last logged: {actuals.lastActivity.name || actuals.lastActivity.type}
              {actuals.lastActivity.distanceKm != null
                ? ` · ${actuals.lastActivity.distanceKm}km`
                : ''}
            </p>
          )}
          {stale && (
            <p className="text-[10px] mt-2 mb-0 text-center" style={{ color: 'var(--text-faint)' }}>
              Showing your last sync ({actuals.date}) &mdash; provider unreachable right now.
            </p>
          )}
          {insight && (
            <p
              className="text-[11px] mt-2.5 mb-0 leading-snug"
              style={{ color: 'var(--text-muted)' }}
            >
              {insight}
            </p>
          )}
        </div>
      )}
    </>
  );
}

// "Forecast vs Actual" dashboard section. The calendar forecast (Focus/
// Strain/Balance + event timing) fuses with wearable actuals (recovery,
// sleep, HRV) into readiness: what's left to train with, at any hour.
export default function WearableSection({
  forecast,
  dayShape,
  wearable,
}: {
  forecast: ForecastScores;
  dayShape: DayShape | null;
  wearable: WearableHook;
}) {
  const {
    connected,
    provider,
    actuals,
    stale,
    available,
    isLoading,
    connect,
    connectDemo,
    disconnect,
  } = wearable;
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
            Your calendar is the forecast. Your body is the actual.
          </p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Connect a wearable and Persist fuses recovery, sleep, and HRV with your Focus, Strain,
            and Balance scores into one number &mdash; readiness &mdash; so whether you train at 6am
            or 6pm, you know how hard to go.
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

  // --- Connected: unlock state + actuals ---
  const insight = actuals ? forecastVsActual(forecast, actuals) : null;

  return (
    <section className="max-w-xs mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-[11px] font-bold uppercase"
          style={{ letterSpacing: '0.12em', color: 'var(--text-faint)' }}
        >
          Forecast vs Actual
        </h2>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase"
          style={{
            backgroundColor: 'var(--signal-soft)',
            color: 'var(--signal-dim)',
            letterSpacing: '0.08em',
          }}
        >
          {provider === 'demo' ? 'Demo data' : provider}
        </span>
      </div>

      <WearablePanel state={state} actuals={actuals} insight={insight} stale={stale} />

      <div className="text-center">
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
