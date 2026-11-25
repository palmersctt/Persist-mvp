'use client';

import { FEEL_LABELS, type FeelRating } from '../lib/engine/history';

const RATINGS: FeelRating[] = [1, 2, 3, 4, 5];

// "How did today actually feel?" — one tap, five chips. The answer is stored
// next to the verdict for calibration; it does not change the verdict.
export default function FeelCheckin({
  rating,
  onRate,
}: {
  rating: FeelRating | undefined;
  onRate: (rating: FeelRating) => void;
}) {
  return (
    <section className="max-w-xs mx-auto mt-5" aria-labelledby="feel-checkin-title">
      <p
        id="feel-checkin-title"
        className="text-xs font-medium text-center mb-2.5"
        style={{ color: 'var(--text-muted)' }}
      >
        How did today actually feel?
      </p>
      <div className="flex gap-1.5" role="radiogroup" aria-labelledby="feel-checkin-title">
        {RATINGS.map((r) => {
          const selected = rating === r;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onRate(r)}
              className="flex-1 rounded-lg py-2.5 text-[11px] font-semibold transition-colors duration-150"
              style={{
                backgroundColor: selected ? 'var(--signal)' : 'var(--surface)',
                color: selected ? 'var(--ground)' : 'var(--text-muted)',
                border: `1px solid ${selected ? 'var(--signal)' : 'var(--rule)'}`,
                minHeight: 44,
              }}
            >
              {FEEL_LABELS[r]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
