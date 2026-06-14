'use client';

import type { DashboardVerdict } from '../lib/dashboardModel';

const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

// Explains a unified verdict: Value/Strain/Fill, the rec + why, and the
// drivers (Recent ÷ Baseline, Work Index). Shared by the dashboard's
// "Why your readiness" panel and the sandbox preview — one renderer.
export default function ReadinessExplain({
  model,
  providerLabel,
}: {
  model: DashboardVerdict;
  providerLabel?: string;
}) {
  const acwrWord =
    model.acwr > 1.3 ? 'over your usual' : model.acwr < 0.85 ? 'under your usual' : 'in your band';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-[11px] font-bold uppercase"
          style={{ letterSpacing: '0.12em', color: 'var(--text-faint)' }}
        >
          Why your readiness
        </h2>
        {providerLabel && (
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

      {/* Value / Strain / Fill */}
      <div
        className="rounded-xl px-4 py-3.5 mb-2.5 flex items-center justify-between"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
      >
        <Score label="Value" value={`${model.value}`} accent />
        <Score label="Strain" value={`${model.strain}`} />
        <Score label="Fill" value={`${model.fill >= 0 ? '+' : ''}${model.fill}`} />
      </div>

      {/* The verdict's reasoning */}
      <p className="text-[11px] leading-snug mb-4" style={{ color: 'var(--text-muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--signal-dim)' }}>
          {model.rec}
        </span>{' '}
        {model.why}
      </p>

      {/* Drivers */}
      <Driver label="Recent ÷ Baseline" value={`${model.acwr.toFixed(2)}×`} note={acwrWord} />
      <Driver label="Work Index" value={`${Math.round(model.workIndexValue)}`} />
    </div>
  );
}

function Score({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className="text-lg font-bold"
        style={{
          color: accent ? 'var(--signal)' : 'var(--text)',
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        className="text-[9px] uppercase tracking-wider mt-0.5 font-medium"
        style={{ color: 'var(--text-faint)' }}
      >
        {label}
      </div>
    </div>
  );
}

function Driver({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 mb-2 flex justify-between items-baseline text-[11px]"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
    >
      <span style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span className="font-semibold" style={{ color: 'var(--text)', fontFamily: MONO }}>
        {value}
        {note ? <span style={{ color: 'var(--text-faint)' }}> · {note}</span> : null}
      </span>
    </div>
  );
}
