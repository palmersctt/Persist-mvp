'use client';

import { useState } from 'react';
import type { DayInput } from '../../lib/engine/types';
import {
  SKETCH_HOURS,
  hourLabel,
  nextMark,
  sketchToDayInput,
  type HourMark,
} from '../../lib/verdict/sketch';

const SURFACE = { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' } as const;

// Tap the hours you're booked; tap again to mark one heavy.
export default function SketchDoor({
  date,
  timezone,
  onDay,
}: {
  date: string;
  timezone: string;
  onDay: (input: DayInput) => void;
}) {
  const [marks, setMarks] = useState<Partial<Record<number, HourMark>>>({});
  const booked = SKETCH_HOURS.filter((h) => marks[h]).length;

  return (
    <div className="reveal-up rounded-2xl px-4 py-5" style={SURFACE}>
      <h2
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--signal)' }}
      >
        Sketch it
      </h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        Tap the hours you’re in meetings. Tap again for a heavy one.
      </p>
      <div className="mt-4 grid grid-cols-5 gap-1.5" role="group" aria-label="Hours of the day">
        {SKETCH_HOURS.map((h) => {
          const m = marks[h];
          return (
            <button
              key={h}
              type="button"
              aria-pressed={!!m}
              aria-label={`${hourLabel(h)}${m === 'heavy' ? ', heavy' : m ? ', booked' : ''}`}
              onClick={() => setMarks((prev) => ({ ...prev, [h]: nextMark(prev[h]) }))}
              className="rounded-lg text-xs font-semibold"
              style={{
                minHeight: 44,
                backgroundColor:
                  m === 'heavy' ? 'var(--signal)' : m ? 'var(--signal-soft)' : 'transparent',
                color: m === 'heavy' ? 'var(--ground)' : m ? 'var(--signal)' : 'var(--text-faint)',
                border: `1px solid ${m ? 'var(--signal-edge)' : 'var(--rule)'}`,
              }}
            >
              {hourLabel(h)}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onDay(sketchToDayInput(marks, date, timezone))}
        className="mt-4 w-full rounded-lg py-3 text-sm font-semibold"
        style={{ border: '1px solid var(--signal)', color: 'var(--signal)' }}
      >
        {booked === 0
          ? 'Score an open day'
          : `Score ${booked} booked hour${booked === 1 ? '' : 's'}`}
      </button>
    </div>
  );
}
