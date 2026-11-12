'use client';

import type { DashboardVerdict } from '../lib/dashboardModel';
import type { PlannedDay } from '../lib/weekPlan';
import type { WearableActuals } from '../lib/wearables/types';

const MONO = 'var(--font-geist-mono), ui-monospace, monospace';
const SURFACE = { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' } as const;

// The dashboard's readiness breakdown — mirrors the landing demo: the
// Recent ÷ Baseline equation, your training (load vs baseline), and your
// workday (the scores that set the Work Index). Shared with the sandbox.
// `body` adds a recovery provider's readings — shown for context; only sleep
// enters the score (via the model), recovery/HRV/resting HR never do.
export default function ReadinessExplain({
  model,
  providerLabel,
  body,
}: {
  model: DashboardVerdict;
  providerLabel?: string;
  body?: Pick<WearableActuals, 'recovery' | 'sleepPerformance' | 'hrvMs' | 'restingHr'> | null;
}) {
  const acwrWord =
    model.acwr > 1.3 ? 'over your usual' : model.acwr < 0.85 ? 'under your usual' : 'in your band';
  const workday = [
    { label: 'Focus', value: model.focus },
    { label: 'Rhythm', value: model.rhythm },
    { label: 'Strain', value: model.strain },
  ];

  const bodyStats = [
    { l: 'Recovery', n: body?.recovery, unit: '%' },
    { l: 'Sleep', n: body?.sleepPerformance, unit: '%' },
    { l: 'HRV ms', n: body?.hrvMs, unit: '' },
    { l: 'Rest bpm', n: body?.restingHr, unit: '' },
  ].filter((s): s is { l: string; n: number; unit: string } => typeof s.n === 'number');

  return (
    <div className="flex flex-col gap-2.5">
      {/* Recent ÷ Baseline = ACWR */}
      <div className="rounded-xl px-4 py-3.5 flex items-center justify-between" style={SURFACE}>
        <Term value={`${model.recent}`} label="Recent" />
        <Op>÷</Op>
        <Term value={`${model.baseline}`} label="Baseline" muted />
        <Op>=</Op>
        <Term value={`${model.acwr.toFixed(2)}×`} label={acwrWord} accent />
      </div>

      {/* Your training */}
      {model.trainingBaseline != null && (
        <div className="rounded-xl px-4 py-3.5" style={SURFACE}>
          <Header title="Your training" tag={providerLabel} />
          <div className="flex justify-between mt-3">
            <Stat n={`${model.trainingBaseline}`} l="Baseline" />
            <Stat n={`${model.weekActivityCount ?? 0}`} l="This week" />
            <Stat n={`${model.trainingLoadToday ?? 0}`} l="Today" />
          </div>
        </div>
      )}

      {/* Your body — a recovery provider's readings */}
      {bodyStats.length > 0 && (
        <div className="rounded-xl px-4 py-3.5" style={SURFACE}>
          <Header title="Your body" tag={providerLabel} />
          <div className="flex justify-between mt-3">
            {bodyStats.map((s) => (
              <Stat key={s.l} n={`${s.n}${s.unit}`} l={s.l} />
            ))}
          </div>
        </div>
      )}

      {/* Your week — where the key sessions fit */}
      {model.plan && model.plan.length > 1 && (
        <div className="rounded-xl px-4 py-3.5" style={SURFACE}>
          <Header title="Your week" tag={model.knowsTraining ? 'Key sessions' : 'Best days'} />
          <div
            className="flex justify-between items-end mt-3"
            style={{ gap: 6 }}
            aria-hidden="true"
          >
            {model.plan.map((day, i) => (
              <WeekDayColumn key={day.date} day={day} today={i === 0} />
            ))}
          </div>
          <p className="sr-only">
            {model.plan
              .map((day, i) => {
                const name =
                  i === 0
                    ? 'Today'
                    : new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en-US', {
                        weekday: 'long',
                        timeZone: 'UTC',
                      });
                const role =
                  day.role === 'easy' ? 'easy' : `${day.role}${day.done ? ', done' : ''}`;
                return `${name}: ${day.heavy ? 'heavy work day, ' : ''}${role}.`;
              })
              .join(' ')}
          </p>
          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            Bars are meeting load. Hard and long sessions go on the lightest days, never back to
            back.
          </p>
        </div>
      )}

      {/* Your workday */}
      <div className="rounded-xl px-4 py-3.5" style={SURFACE}>
        <Header title="Your workday" tag={`Work Index ${Math.round(model.workIndexValue)}`} />
        <div className="flex flex-col gap-2.5 mt-3">
          {workday.map((m) => (
            <Bar key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekDayColumn({ day, today }: { day: PlannedDay; today: boolean }) {
  const key = day.role !== 'easy';
  const weekday = new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  return (
    <div className="flex-1 flex flex-col items-center" style={{ minWidth: 0 }}>
      <div
        className="w-full rounded-sm flex items-end"
        style={{ height: 36, backgroundColor: 'var(--rule)' }}
        aria-hidden="true"
      >
        <div
          className="w-full rounded-sm"
          style={{
            height: `${Math.max(4, Math.min(100, (day.workLoad / 120) * 100))}%`,
            backgroundColor: key ? 'var(--signal)' : 'var(--text-faint)',
          }}
        />
      </div>
      <div
        className="text-[9px] font-bold uppercase mt-1.5"
        style={{
          letterSpacing: '0.04em',
          color: key ? 'var(--signal)' : 'var(--text-faint)',
          minHeight: 12,
        }}
      >
        {key ? (day.done ? 'Done' : day.role) : ''}
      </div>
      <div
        className="text-[9px] uppercase mt-0.5 font-medium"
        style={{ color: today ? 'var(--text)' : 'var(--text-faint)' }}
      >
        {today ? 'Today' : weekday}
      </div>
    </div>
  );
}

function Term({
  value,
  label,
  accent,
  muted,
}: {
  value: string;
  label: string;
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
        className="text-[8px] uppercase tracking-wider mt-1.5 font-medium"
        style={{ color: 'var(--text-faint)' }}
      >
        {label}
      </div>
    </div>
  );
}

function Op({ children }: { children: string }) {
  return (
    <span className="text-sm font-semibold" style={{ color: 'var(--text-faint)' }}>
      {children}
    </span>
  );
}

function Header({ title, tag }: { title: string; tag?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[11px] font-bold uppercase"
        style={{ letterSpacing: '0.08em', color: 'var(--text)' }}
      >
        {title}
      </span>
      {tag && (
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
          style={{
            backgroundColor: 'var(--signal-soft)',
            color: 'var(--signal-dim)',
            letterSpacing: '0.06em',
          }}
        >
          {tag}
        </span>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div
        className="text-lg font-bold"
        style={{ color: 'var(--signal)', fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}
      >
        {n}
      </div>
      <div
        className="text-[9px] uppercase tracking-wider mt-0.5 font-medium"
        style={{ color: 'var(--text-faint)' }}
      >
        {l}
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span
          className="text-xs"
          style={{
            color: 'var(--text-faint)',
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
      <div className="w-full rounded-full" style={{ height: 4, backgroundColor: 'var(--rule)' }}>
        <div
          className="rounded-full bar-grow"
          style={{
            height: 4,
            width: `${Math.max(0, Math.min(100, value))}%`,
            backgroundColor: 'var(--signal)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}
