import { describe, it, expect } from 'vitest';
import { assistantPrompt, explainErrors, extractJson } from './assistantPrompt';
import { parseDayInput } from '../engine/parse';

const DATE = '2026-11-25';
const TZ = 'America/New_York';

describe('assistantPrompt', () => {
  it('asks for metadata only, for today in my zone', () => {
    const p = assistantPrompt('copilot', DATE, TZ);
    expect(p).toContain('Outlook calendar');
    expect(p).toContain(`"date": "${DATE}"`);
    expect(p).toContain(TZ);
    expect(p).toMatch(/no titles/);
  });

  it('its example reply parses once the offset is filled in', () => {
    const reply = assistantPrompt('claude', DATE, TZ).replaceAll('±hh:mm', '-05:00');
    expect(parseDayInput(extractJson(reply)).ok).toBe(true);
  });
});

describe('extractJson', () => {
  const day = { version: 1, date: DATE, timezone: TZ, meetings: [] };
  it('reads raw JSON', () => {
    expect(extractJson(JSON.stringify(day))).toEqual(day);
  });
  it('reads a fenced block with chatter around it', () => {
    expect(
      extractJson(
        `Here you go:\n\`\`\`json\n${JSON.stringify(day, null, 2)}\n\`\`\`\nAnything else?`
      )
    ).toEqual(day);
  });
  it('returns null for anything else', () => {
    expect(extractJson('I could not access your calendar.')).toBeNull();
    expect(extractJson('{ not json }')).toBeNull();
  });
});

describe('explainErrors', () => {
  it('turns validation errors into fixes', () => {
    expect(
      explainErrors([
        'meetings[2].start must be an ISO date-time with an offset',
        'meetings[2].end must be an ISO date-time with an offset',
        'meetings[0].start must fall on 2026-11-25 in America/New_York',
        'timezone must be an IANA time zone',
      ])
    ).toEqual([
      'Meeting 3 has a time without a time zone. Ask your assistant to add the UTC offset (like -05:00).',
      "Meeting 1 isn't on today's date. Ask your assistant for today's events only.",
      'The time zone is missing or not recognised (e.g. America/New_York).',
    ]);
  });
});
