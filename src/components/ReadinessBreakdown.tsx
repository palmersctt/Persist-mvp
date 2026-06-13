'use client';

import type { MetricKey, ReadinessContributions, ReadinessState } from '../lib/readiness';

const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

const PHASE_LABELS: Record<ReadinessState['phase'], string> = {
  morning: 'Morning window',
  workday: 'Mid-workday',
  clear: 'Workday clear',
};

/**
 * The "see why" section beneath the readiness card. Shows the two sides of
 * the equation that produced the number: what the body brought (capacity,
 * from the wearable) and what the workday is taking (the tax, split across
 * Focus / Strain / Balance). Each workday metric is clickable into its
 * detail tab.
 */
export default function ReadinessBreakdown({
  state,
  contributions,
  connected,
  providerLabel,
  onMetricClick,
  onConnect,
}: {
  state: ReadinessState;
  contributions: ReadinessContributions;
  connected: boolean;
  providerLabel?: string;
  onMetricClick?: (metric: MetricKey) => void;
  onConnect?: () => void;
}) {
  const { capacity, workdayTax, workday, body } = contributions;
  const maxPoints = Math.max(1, ...workday.map((w) => w.points));

  return (
    <section className="max-w-xs mx-auto w-full">
      <h2
        className="text-[11px] font-bold uppercase mb-3"
        style={{ letterSpacing: '0.12em', color: 'var(--text-faint)' }}
      >
        Why your readiness
      </h2>

      {/* The equation: body capacity − workday cost → readiness */}
      <div
        className="rounded-xl px-4 py-3.5 mb-2.5 flex items-center justify-between"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
      >
        <Term label="Body" value={capacity != null ? `${capacity}` : '—'} />
        <Operator symbol="−" />
        <Term label="Workday" value={`${workdayTax}`} muted />
        <Operator symbol="=" />
        <Term
          label="Readiness"
          value={state.readinessNow != null ? `${state.readinessNow}` : '—'}
          accent
        />
      </div>

      {/* AM/PM intelligence — the phase line from the algorithm */}
      <p className="text-[11px] leading-snug mb-4" style={{ color: 'var(--text-muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--signal-dim)' }}>
          {PHASE_LABELS[state.phase]}.
        </span>{' '}
        {state.detail}
      </p>

      {/* Body capacity — from the wearable */}
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-[10px] font-bold uppercase"
          style={{ letterSpacing: '0.1em', color: 'var(--text)' }}
        >
          What your body brought
        </h3>
        {connected && providerLabel && (
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
            style={{
              backgroundColor: 'var(--signal-soft)',
              color: 'var(--signal-dim)',
              letterSpacing: '0.06em',
            }}
          >
            {providerLabel}
          </span>
        )}
      </div>
      {body.length > 0 ? (
        <div
          className="rounded-xl px-4 py-3.5 mb-5 flex justify-between"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
        >
          {body.map((f) => (
            <div key={f.label} className="text-center" title={f.note}>
              <div
                className="text-lg font-bold"
                style={{
                  color: 'var(--signal)',
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {f.value}
              </div>
              <div
                className="text-[9px] uppercase tracking-wider mt-0.5 font-medium"
                style={{ color: 'var(--text-faint)' }}
              >
                {f.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="w-full rounded-xl px-4 py-3.5 mb-5 text-left transition-colors"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px dashed var(--rule)',
            cursor: onConnect ? 'pointer' : 'default',
          }}
        >
          <p className="text-xs mb-0" style={{ color: 'var(--text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--signal)' }}>
              Connect a wearable
            </span>{' '}
            to factor recovery, sleep, and HRV into your readiness. Until then it&apos;s the workday
            forecast alone.
          </p>
        </button>
      )}

      {/* Workday cost — Focus / Strain / Balance, ranked by impact */}
      <h3
        className="text-[10px] font-bold uppercase mb-2"
        style={{ letterSpacing: '0.1em', color: 'var(--text)' }}
      >
        What your workday is taking
      </h3>
      <div className="flex flex-col gap-2">
        {workday.map((w) => (
          <button
            key={w.metric}
            onClick={onMetricClick ? () => onMetricClick(w.metric) : undefined}
            className="rounded-xl px-4 py-3 text-left transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--rule)',
              cursor: onMetricClick ? 'pointer' : 'default',
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                  {w.label}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--text-faint)',
                    fontFamily: MONO,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {w.value}
                </span>
              </div>
              <span
                className="text-xs font-semibold"
                style={{
                  color: w.points > 0 ? 'var(--signal)' : 'var(--text-faint)',
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {w.points > 0 ? `−${w.points}` : '0'}
              </span>
            </div>
            <div
              className="w-full rounded-full mb-1.5"
              style={{ height: 4, backgroundColor: 'var(--rule)' }}
            >
              <div
                className="rounded-full"
                style={{
                  height: 4,
                  width: `${Math.round((w.points / maxPoints) * 100)}%`,
                  backgroundColor: 'var(--signal)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p className="text-[11px] leading-snug mb-0" style={{ color: 'var(--text-muted)' }}>
              {w.note}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

function Term({
  label,
  value,
  accent = false,
  muted = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className="text-xl font-bold"
        style={{
          color: accent ? 'var(--signal)' : muted ? 'var(--text-muted)' : 'var(--text)',
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        className="text-[8px] uppercase tracking-wider mt-1 font-medium"
        style={{ color: 'var(--text-faint)' }}
      >
        {label}
      </div>
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span className="text-sm font-semibold" style={{ color: 'var(--text-faint)' }}>
      {symbol}
    </span>
  );
}
