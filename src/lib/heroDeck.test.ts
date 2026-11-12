import { describe, it, expect } from 'vitest';
import { HERO_DECK, HERO_FRONT_INDEX, deckSlot, stepDeck } from './heroDeck';
import { MOOD_TIERS, VERDICT_LABEL, VERDICT_MOOD, getMoodTier } from './mood';
import { VERDICT_TIER, type Verdict } from './model';

const VERDICTS: Verdict[] = ['Survival', 'Grinding', 'Coasting', 'Locked In', 'Flow'];

describe('HERO_DECK', () => {
  it('has one card per verdict, worst day first', () => {
    expect(HERO_DECK.map((c) => c.verdict)).toEqual(VERDICTS);
  });

  it('takes each mood and label from mood.ts', () => {
    for (const c of HERO_DECK) {
      expect(c.mood).toBe(VERDICT_MOOD[c.verdict]);
      expect(c.label).toBe(VERDICT_LABEL[c.verdict]);
      expect(getMoodTier(c.mood)).toBe(VERDICT_TIER[c.verdict]);
      expect(MOOD_TIERS[VERDICT_TIER[c.verdict]]).toContain(c.mood);
    }
  });

  it('gives every card its own quote, attribution and line', () => {
    for (const key of ['quote', 'source', 'subtitle'] as const) {
      const values = HERO_DECK.map((c) => c[key]);
      expect(values.every((v) => v.trim().length > 0)).toBe(true);
      expect(new Set(values).size).toBe(HERO_DECK.length);
    }
  });

  it('keeps scores in range, with Readiness rising as the day gets better', () => {
    for (const c of HERO_DECK) {
      expect(c.readiness).toBeGreaterThanOrEqual(0);
      expect(c.readiness).toBeLessThanOrEqual(100);
      expect(c.load).toBeGreaterThanOrEqual(0);
      expect(c.load).toBeLessThanOrEqual(100);
    }
    const byTier = (tier: string) =>
      HERO_DECK.filter((c) => VERDICT_TIER[c.verdict] === tier).map((c) => c.readiness);
    expect(Math.max(...byTier('bad'))).toBeLessThan(Math.min(...byTier('ok')));
    expect(Math.max(...byTier('ok'))).toBeLessThan(Math.min(...byTier('good')));
  });

  it('opens on Flow', () => {
    expect(HERO_DECK[HERO_FRONT_INDEX].verdict).toBe('Flow');
  });
});

describe('deckSlot', () => {
  it('places the front card, its neighbours, and hides the rest', () => {
    expect([0, 1, 2, 3, 4].map((i) => deckSlot(i, 2, 5))).toEqual([
      'hidden',
      'previous',
      'front',
      'next',
      'hidden',
    ]);
  });

  it('wraps at both ends', () => {
    expect(deckSlot(0, 4, 5)).toBe('next');
    expect(deckSlot(4, 0, 5)).toBe('previous');
  });
});

describe('stepDeck', () => {
  it('moves forward and back, wrapping', () => {
    expect(stepDeck(4, 1, 5)).toBe(0);
    expect(stepDeck(0, -1, 5)).toBe(4);
    expect(stepDeck(2, 1, 5)).toBe(3);
  });

  it('returns to the start after a full lap', () => {
    let front = HERO_FRONT_INDEX;
    for (let i = 0; i < HERO_DECK.length; i++) front = stepDeck(front, 1, HERO_DECK.length);
    expect(front).toBe(HERO_FRONT_INDEX);
  });
});
