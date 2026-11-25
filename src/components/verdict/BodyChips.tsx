'use client';

import type { BodyChips as Chips, Slept, Trained } from '../../lib/verdict/sketch';

const TRAINED: { v: Trained; l: string }[] = [
  { v: 'none', l: 'Rest' },
  { v: 'easy', l: 'Easy' },
  { v: 'hard', l: 'Hard' },
  { v: 'long', l: 'Long' },
];
const SLEPT: { v: Slept; l: string }[] = [
  { v: 'rough', l: 'Rough' },
  { v: 'ok', l: 'OK' },
  { v: 'great', l: 'Great' },
];

function Row<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex flex-1 gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? undefined : o.v)}
              className="flex-1 rounded-lg py-2 text-xs font-semibold"
              style={{
                minHeight: 40,
                backgroundColor: on ? 'var(--signal)' : 'transparent',
                color: on ? 'var(--ground)' : 'var(--text-muted)',
                border: `1px solid ${on ? 'var(--signal)' : 'var(--rule)'}`,
              }}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Optional: how you trained and slept. Applies to whichever door you use.
export default function BodyChips({
  value,
  onChange,
}: {
  value: Chips;
  onChange: (c: Chips) => void;
}) {
  return (
    <div className="reveal-up rounded-2xl px-4 py-4" style={{ border: '1px dashed var(--rule)' }}>
      <h2
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Your body today <span style={{ color: 'var(--text-faint)' }}>· optional</span>
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        <Row
          label="Training"
          options={TRAINED}
          value={value.trained}
          onChange={(trained) => onChange({ ...value, trained })}
        />
        <Row
          label="Sleep"
          options={SLEPT}
          value={value.slept}
          onChange={(slept) => onChange({ ...value, slept })}
        />
      </div>
    </div>
  );
}
