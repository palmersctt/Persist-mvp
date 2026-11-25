'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import PersistLogo from '../PersistLogo';
import SwipeableQuoteCards from '../SwipeableQuoteCards';
import ReadinessExplain from '../ReadinessExplain';
import Reveal from './Reveal';
import Receipt from './Receipt';
import BodyChips from './BodyChips';
import { withChips, type BodyChips as Chips } from '../../lib/verdict/sketch';
import { VERDICT_MOOD } from '../../lib/mood';
import { scoreDay, type EngineResult } from '../../lib/engine/scoreDay';
import { scoreWork, type WorkDayAnalysis } from '../../lib/engine/workScores';
import type { DayInput } from '../../lib/engine/types';
import { EXAMPLE_DAYS } from '../../lib/verdict/examples';
import { browserDay } from '../../lib/verdict/localTime';
import { cardQuotes, type CardQuote } from '../../lib/verdict/quotes';
import { receipt, revealLines } from '../../lib/verdict/story';
import { shareCard } from '../../lib/verdict/share';

interface Scored {
  input: DayInput;
  result: EngineResult;
  work: WorkDayAnalysis;
  quotes: CardQuote[];
  lines: string[];
}

const SURFACE = { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' } as const;

/** Score a day entirely in the browser. */
export function scoreInBrowser(input: DayInput): Scored {
  const result = scoreDay(input);
  const work = scoreWork(input.meetings ?? [], input.timezone);
  return { input, result, work, quotes: cardQuotes(work), lines: revealLines(input, work, result) };
}

export default function VerdictExperience({
  doors,
}: {
  /** Extra ways in (assistant paste, sketch), rendered above the examples. */
  doors?: (score: (input: DayInput) => void) => React.ReactNode;
}) {
  const [scored, setScored] = useState<Scored | null>(null);
  const [stage, setStage] = useState<'choose' | 'reveal' | 'result'>('choose');
  const [shareState, setShareState] = useState<'idle' | 'busy'>('idle');
  const [chips, setChips] = useState<Chips>({});
  const cardRef = useRef<HTMLDivElement | null>(null);
  const day = useMemo(() => browserDay(), []);

  const score = useCallback(
    (input: DayInput) => {
      setScored(scoreInBrowser(withChips(input, chips)));
      setStage('reveal');
      window.scrollTo?.({ top: 0 });
    },
    [chips]
  );
  const finishReveal = useCallback(() => setStage('result'), []);

  const share = async () => {
    if (!cardRef.current || shareState === 'busy') return;
    setShareState('busy');
    try {
      await shareCard(cardRef.current);
    } finally {
      setShareState('idle');
    }
  };

  const r = scored?.result;

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: 'var(--ground)', color: 'var(--text)' }}
    >
      <header className="max-w-xl mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Persist home">
          <PersistLogo size={26} />
          <span className="text-sm font-bold tracking-tight">PERSIST</span>
        </Link>
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          Sign in
        </button>
      </header>

      {stage === 'reveal' && scored && <Reveal lines={scored.lines} onDone={finishReveal} />}

      {stage !== 'result' || !scored || !r ? (
        <section className="max-w-xl mx-auto px-4 pb-16">
          <h1 className="reveal-up text-4xl sm:text-5xl font-bold tracking-tight mt-6 leading-[1.05]">
            Get your <span style={{ color: 'var(--signal)' }}>verdict.</span>
          </h1>
          <p
            className="reveal-up mt-4 text-base leading-relaxed"
            style={{ '--d': '0.08s', color: 'var(--text-muted)' } as React.CSSProperties}
          >
            Bring today — from your assistant, a quick sketch, or an example. Persist reads the load
            and tells you how hard to go. No account, nothing uploaded.
          </p>

          {doors && <div className="mt-8 flex flex-col gap-4">{doors(score)}</div>}

          <div className="mt-4">
            <BodyChips value={chips} onChange={setChips} />
          </div>

          <div className="mt-8">
            <h2
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--signal)' }}
            >
              Try an example
            </h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {EXAMPLE_DAYS.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => score(e.build(day.date, day.timezone))}
                  className="reveal-up text-left rounded-xl px-4 py-3.5 transition-colors hover:border-[var(--signal-edge)]"
                  style={
                    {
                      ...SURFACE,
                      '--d': `${0.12 + i * 0.05}s`,
                      minHeight: 72,
                    } as React.CSSProperties
                  }
                >
                  <span className="block text-sm font-semibold">{e.title}</span>
                  <span className="block mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {e.blurb}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-xs mx-auto px-0 pb-16" aria-live="polite">
          <p
            className="reveal-up text-center text-[11px] font-bold uppercase tracking-[0.18em] mt-2"
            style={{ color: 'var(--text-faint)' }}
          >
            Today’s verdict
          </p>
          <div
            className={`reveal-card mt-3 ${r.tier === 'good' ? 'verdict-glow' : ''}`}
            style={{ '--d': '0.05s' } as React.CSSProperties}
          >
            <SwipeableQuoteCards
              quotes={scored.quotes}
              readiness={r.readiness}
              load={r.load}
              balance={r.balance}
              mood={VERDICT_MOOD[r.verdict]}
              verdict={r.label}
              activeCardRef={(el) => {
                cardRef.current = el;
              }}
            />
          </div>

          <p
            className="reveal-up mt-4 text-center text-sm font-semibold"
            style={{ '--d': '0.35s' } as React.CSSProperties}
          >
            {r.rec}
          </p>

          <div
            className="reveal-up mt-6 flex flex-col gap-2.5"
            style={{ '--d': '0.5s' } as React.CSSProperties}
          >
            <ReadinessExplain model={r} />
            <Receipt data={receipt(scored.input)} />
          </div>

          <div
            className="reveal-up mt-6 flex flex-col gap-2"
            style={{ '--d': '0.65s' } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full rounded-xl py-3.5 text-sm font-semibold"
              style={{ backgroundColor: 'var(--signal)', color: 'var(--ground)' }}
            >
              Get this every morning
            </button>
            <button
              type="button"
              onClick={share}
              disabled={shareState === 'busy'}
              className="w-full rounded-xl py-3.5 text-sm font-medium"
              style={{ ...SURFACE, color: 'var(--text)' }}
            >
              {shareState === 'busy' ? 'Making your card…' : 'Share my card'}
            </button>
            {doors && (
              <button
                type="button"
                onClick={() => setStage('choose')}
                className="w-full rounded-xl py-3.5 text-sm font-medium"
                style={{ ...SURFACE, color: 'var(--text)' }}
              >
                Your assistant can do this daily
              </button>
            )}
            <button
              type="button"
              onClick={() => setStage('choose')}
              className="w-full py-2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Score another day
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
