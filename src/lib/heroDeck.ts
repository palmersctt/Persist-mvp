import type { Verdict } from './model';
import { VERDICT_LABEL, VERDICT_MOOD, type Mood } from './mood';

// The landing hero's deck: one example card per verdict, in order of the day
// getting better. Copy only — moods and labels come from mood.ts.

export interface HeroCard {
  verdict: Verdict;
  mood: Mood;
  /** The action label shown beside the mood name. */
  label: string;
  quote: string;
  source: string;
  subtitle: string;
  readiness: number;
  load: number;
  balance: number;
}

const card = (
  verdict: Verdict,
  scores: [readiness: number, load: number, balance: number],
  quote: string,
  source: string,
  subtitle: string
): HeroCard => ({
  verdict,
  mood: VERDICT_MOOD[verdict],
  label: VERDICT_LABEL[verdict],
  quote,
  source,
  subtitle,
  readiness: scores[0],
  load: scores[1],
  balance: scores[2],
});

export const HERO_DECK: HeroCard[] = [
  card(
    'Survival',
    [25, 88, -21],
    'I’m trying very hard not to connect with people right now.',
    'David Rose · Schitt’s Creek',
    'Back-to-backs all day on a heavy week. Today the couch is the workout.'
  ),
  card(
    'Grinding',
    [46, 71, -6],
    'The work is mysterious and important.',
    'Mark S. · Severance',
    'Six meetings that could have been emails. Keep the run easy.'
  ),
  card(
    'Coasting',
    [58, 34, 6],
    'I am running away from my responsibilities. And it feels good.',
    'Michael Scott · The Office',
    'Quiet calendar, nothing to prove. Train if you feel like it.'
  ),
  card(
    'Locked In',
    [86, 22, 24],
    'Don’t you dare settle for fine.',
    'Roy Kent · Ted Lasso',
    'Clear afternoon, rested legs. This is the day you were saving it for.'
  ),
  card(
    'Flow',
    [74, 38, 17],
    'I have no idea what I’m doing, but I know I’m doing it really, really well.',
    'Andy Dwyer · Parks and Recreation',
    'Eight meetings and intervals at six, still inside your band.'
  ),
];

/** The card in front on load: Flow, the verdict the demo below arrives at. */
export const HERO_FRONT_INDEX = HERO_DECK.length - 1;

export type DeckSlot = 'front' | 'next' | 'previous' | 'hidden';

/** Where card `index` sits when card `front` is in front, in a deck of `size`. */
export function deckSlot(index: number, front: number, size: number): DeckSlot {
  const offset = (((index - front) % size) + size) % size;
  if (offset === 0) return 'front';
  if (offset === 1) return 'next';
  if (offset === size - 1) return 'previous';
  return 'hidden';
}

/** The front index after moving one card forward (1) or back (-1); wraps. */
export function stepDeck(front: number, direction: 1 | -1, size: number): number {
  return (((front + direction) % size) + size) % size;
}
