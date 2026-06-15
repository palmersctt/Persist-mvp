'use client';

import { useMemo, useState } from 'react';
import {
  buildTrendsFromHistory,
  MIN_WEEKLY_DAYS,
  MIN_MONTHLY_WEEKS,
  type DailyScore,
} from '../lib/trends';
import { trackEvent } from '../lib/trackEvent';

const W = 280;
const H = 48;
const PAD_X = 12;
const PAD_Y = 6;

function buildPath(rawValues: number[]) {
  // A single tracked day still draws: render it as a flat line with a dot
  const values = rawValues.length === 1 ? [rawValues[0], rawValues[0]] : rawValues;
  if (values.length < 2) return { line: '', area: '', pts: [] as { x: number; y: number }[] };
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const xStep = (W - PAD_X * 2) / (values.length - 1);
  const pts = values.map((v, i) => ({
    x: PAD_X + i * xStep,
    y: PAD_Y + (1 - (v - minV) / range) * (H - PAD_Y * 2),
  }));
  let line = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cp = xStep * 0.35;
    line += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  return { line, area, pts };
}

export default function TrendsSection({ history }: { history: DailyScore[] }) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const trends = useMemo(() => buildTrendsFromHistory(history), [history]);

  if (trends.daysTracked === 0 || !trends.weekly) return null;

  const baselineReady = trends.daysTracked >= MIN_WEEKLY_DAYS;
  const monthlyReady = !!trends.monthly;
  const activeView = view === 'monthly' && !monthlyReady ? 'weekly' : view;

  const items =
    activeView === 'weekly'
      ? trends.weekly.days.map((d) => ({
          label: d.date,
          focus: d.focus,
          strain: d.strain,
          balance: d.balance,
          isToday: !!d.isToday,
        }))
      : trends.monthly!.weeks.map((w) => ({
          label: w.label,
          focus: w.focus,
          strain: w.strain,
          balance: w.balance,
          isToday: false,
        }));

  const allInsights = activeView === 'weekly' ? trends.weekly.insights : trends.monthly!.insights;

  const metrics = [
    { key: 'focus' as const, label: 'Focus', getValue: (d: (typeof items)[0]) => d.focus },
    { key: 'strain' as const, label: 'Strain', getValue: (d: (typeof items)[0]) => d.strain },
    { key: 'balance' as const, label: 'Rhythm', getValue: (d: (typeof items)[0]) => d.balance },
  ];

  return (
    <section className="max-w-xs mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-[11px] font-bold uppercase"
          style={{ letterSpacing: '0.12em', color: 'var(--text-faint)' }}
        >
          Your Trends
        </h2>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{ backgroundColor: 'var(--signal-soft)', color: 'var(--signal-dim)' }}
        >
          {trends.daysTracked} {trends.daysTracked === 1 ? 'day' : 'days'} tracked
        </span>
      </div>

      {/* Baseline progress — the real charts render from day 1; this strip
          shows how close insights are to unlocking */}
      {!baselineReady && (
        <div
          className="rounded-xl px-4 py-3.5 mb-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
              Baseline building
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--signal)' }}>
              Day {trends.daysTracked} of {MIN_WEEKLY_DAYS}
            </span>
          </div>
          <div className="flex gap-1.5 mb-2">
            {Array.from({ length: MIN_WEEKLY_DAYS }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor: i < trends.daysTracked ? 'var(--signal)' : 'var(--rule)',
                }}
              />
            ))}
          </div>
          <p className="text-[11px] leading-relaxed mb-0" style={{ color: 'var(--text-muted)' }}>
            Today&apos;s scores are already on the charts below &mdash; each day adds a point.
            Insights and best/hardest day unlock at {MIN_WEEKLY_DAYS} tracked days.
          </p>
        </div>
      )}

      <div
        className="flex rounded-lg overflow-hidden mb-4"
        style={{ border: '1px solid var(--rule)' }}
      >
        {(['weekly', 'monthly'] as const).map((v) => {
          const disabled = v === 'monthly' && !monthlyReady;
          return (
            <button
              key={v}
              disabled={disabled}
              title={disabled ? `Unlocks after ${MIN_MONTHLY_WEEKS} tracked weeks` : undefined}
              onClick={() => {
                trackEvent('trends_view_toggled', { from: activeView, to: v });
                setView(v);
              }}
              className="flex-1 py-2.5 px-4 text-[13px] font-semibold transition-all"
              style={{
                border: 'none',
                fontFamily: 'inherit',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: activeView === v ? 'var(--signal)' : 'transparent',
                color:
                  activeView === v
                    ? 'var(--ground)'
                    : disabled
                      ? 'var(--text-faint)'
                      : 'var(--text-muted)',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {v === 'weekly' ? 'This Week' : 'This Month'}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {metrics.map(({ key, label, getValue }) => {
          const values = items.map(getValue);
          const { line, area, pts } = buildPath(values);
          const todayIdx = items.findIndex((d) => d.isToday);
          const current = values[todayIdx >= 0 ? todayIdx : values.length - 1];

          // Direction arrow — compare first-half vs second-half averages
          // (needs at least two points to mean anything)
          let isUp = false;
          let isDown = false;
          if (values.length >= 2) {
            const half = Math.floor(values.length / 2);
            const firstHalf = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
            const secondHalf =
              values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half);
            const diff = secondHalf - firstHalf;
            isUp = diff > 3;
            isDown = diff < -3;
          }

          const topInsight = allInsights.find((ins) => ins.metric === key);

          return (
            <div
              key={key}
              className="rounded-xl px-4 pt-3.5 pb-3"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: 'var(--signal)' }}
                  />
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: 'var(--signal)',
                      fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {current}
                  </span>
                  {(isUp || isDown) && (
                    <span className="text-xs font-bold" style={{ color: 'var(--signal)' }}>
                      {isUp ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </div>

              <svg
                width="100%"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ display: 'block', color: 'var(--signal)' }}
                aria-hidden="true"
              >
                {area && <path d={area} fill="currentColor" opacity={0.08} />}
                {line && (
                  <path
                    d={line}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {pts.length > 0 && todayIdx >= 0 && todayIdx < pts.length && (
                  <>
                    <circle
                      cx={pts[todayIdx].x}
                      cy={pts[todayIdx].y}
                      r={5}
                      fill="currentColor"
                      opacity={0.15}
                    />
                    <circle cx={pts[todayIdx].x} cy={pts[todayIdx].y} r={3} fill="currentColor" />
                  </>
                )}
              </svg>

              <div className="flex justify-between mt-1 px-1">
                {items.map((d, i) => (
                  <span
                    key={`${d.label}-${i}`}
                    className="text-[9px]"
                    style={{
                      fontWeight: d.isToday ? 800 : 500,
                      color: d.isToday ? 'var(--signal)' : 'var(--text-faint)',
                    }}
                  >
                    {d.isToday ? 'Today' : d.label}
                  </span>
                ))}
              </div>

              {topInsight && (
                <p
                  className="text-[11px] mt-2 mb-0 leading-snug"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {topInsight.title}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {activeView === 'weekly' && baselineReady && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div
            className="rounded-lg px-3.5 py-3"
            style={{
              backgroundColor: 'var(--signal-soft)',
              border: '1px solid var(--signal-edge)',
            }}
          >
            <span
              className="text-[10px] font-bold uppercase"
              style={{ color: 'var(--signal)', letterSpacing: '0.1em' }}
            >
              Best day
            </span>
            <p className="text-[15px] font-bold mt-0.5 mb-0" style={{ color: 'var(--text)' }}>
              {trends.weekly.bestDay}
            </p>
          </div>
          <div
            className="rounded-lg px-3.5 py-3"
            style={{
              backgroundColor: 'var(--signal-soft)',
              border: '1px solid var(--signal-edge)',
            }}
          >
            <span
              className="text-[10px] font-bold uppercase"
              style={{ color: 'var(--signal)', letterSpacing: '0.1em' }}
            >
              Hardest day
            </span>
            <p className="text-[15px] font-bold mt-0.5 mb-0" style={{ color: 'var(--text)' }}>
              {trends.weekly.worstDay}
            </p>
          </div>
        </div>
      )}

      {activeView === 'monthly' && trends.monthly && (
        <div className="text-center mt-3">
          <span
            className="text-xs font-bold"
            style={{
              color: trends.monthly.trend === 'stable' ? 'var(--text-faint)' : 'var(--signal)',
            }}
          >
            {trends.monthly.trend === 'improving' && '↑ Improving'}
            {trends.monthly.trend === 'declining' && '↓ Declining'}
            {trends.monthly.trend === 'stable' && '— Stable'}
          </span>
        </div>
      )}

      {allInsights.length > 0 && (
        <details
          className="mt-3"
          onToggle={(e) => {
            if ((e.target as HTMLDetailsElement).open) {
              trackEvent('trends_insights_expanded', { view: activeView });
            }
          }}
        >
          <summary
            className="text-xs font-semibold cursor-pointer py-2 flex items-center gap-1.5 list-none"
            style={{ color: 'var(--text-faint)' }}
          >
            <span className="text-[10px]">&#9654;</span>
            All insights ({allInsights.length})
          </summary>
          <div className="pt-1">
            {allInsights.map((insight, i, arr) => (
              <div
                key={i}
                className="py-3"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--rule)' : 'none' }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--signal)' }}
                  />
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                    {insight.title}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed pl-3 mb-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
