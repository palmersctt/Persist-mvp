'use client';

import { useEffect } from 'react';

const LINE_MS = 650;
const HOLD_MS = 500;

// The splash: the engine reads your day back, line by line, then hands over
// to the card. Tap anywhere to skip; instant under reduced motion.
export default function Reveal({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(onDone, reduced ? 0 : lines.length * LINE_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [lines, onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Skip to your verdict"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center cursor-pointer"
      style={{ backgroundColor: 'var(--ground)' }}
    >
      <p
        className="reveal-up text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--signal)' }}
      >
        Reading your day
      </p>
      <div className="mt-6 flex flex-col gap-3" aria-live="polite">
        {lines.map((line, i) => (
          <p
            key={line}
            className="reveal-up text-lg sm:text-2xl font-semibold"
            style={
              {
                '--d': `${0.2 + i * (LINE_MS / 1000)}s`,
                color: i === lines.length - 1 ? 'var(--text)' : 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
              } as React.CSSProperties
            }
          >
            {line}
          </p>
        ))}
      </div>
      <p className="absolute bottom-8 text-[11px]" style={{ color: 'var(--text-faint)' }}>
        Tap to skip
      </p>
    </button>
  );
}
