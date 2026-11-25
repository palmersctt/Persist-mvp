// The prompt a visitor runs in their own assistant (which already has their
// work calendar), and the tools to read its reply back.

export type Assistant = 'copilot' | 'chatgpt' | 'claude';

export const ASSISTANTS: { id: Assistant; name: string; where: string }[] = [
  { id: 'copilot', name: 'Copilot', where: 'Microsoft 365 Copilot (work account)' },
  { id: 'chatgpt', name: 'ChatGPT', where: 'ChatGPT with your calendar connected' },
  { id: 'claude', name: 'Claude', where: 'Claude with your calendar connected' },
];

const SOURCE: Record<Assistant, string> = {
  copilot: 'my Outlook calendar',
  chatgpt: 'my connected calendar',
  claude: 'my connected calendar',
};

/** The prompt to copy, for today in the visitor's zone. */
export function assistantPrompt(who: Assistant, date: string, timezone: string): string {
  return `Look at ${SOURCE[who]} for today (${date}, time zone ${timezone}).
Reply with ONLY this JSON — no titles, no names, no descriptions:

{
  "version": 1,
  "date": "${date}",
  "timezone": "${timezone}",
  "meetings": [
    { "start": "${date}T09:00:00±hh:mm", "end": "${date}T10:00:00±hh:mm", "attendees": 6, "category": "COLLABORATIVE" }
  ]
}

Rules:
- One entry per timed event today; skip all-day events.
- start and end are ISO 8601 with the UTC offset for ${timezone}.
- category is one of: HEAVY_MEETINGS (presentations, reviews, interviews), COLLABORATIVE (working sessions, team meetings), LIGHT_MEETINGS (1:1s, stand-ups, check-ins), FOCUS_WORK (focus blocks), BENEFICIAL (exercise, meals, family), NEUTRAL (travel, holds, out of office).
- attendees is the number of people invited, including me.
- If today is empty, use "meetings": [].`;
}

/** The JSON object in a pasted reply: raw, or inside a ``` fence. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Engine validation errors → fixes a person can act on. */
export function explainErrors(errors: string[]): string[] {
  const out = errors.map((e) => {
    const m = /^meetings\[(\d+)\]\.(\w+)/.exec(e);
    const which = m ? `Meeting ${Number(m[1]) + 1}` : null;
    if (/with an offset/.test(e))
      return `${which} has a time without a time zone. Ask your assistant to add the UTC offset (like -05:00).`;
    if (/must fall on/.test(e))
      return `${which} isn't on today's date. Ask your assistant for today's events only.`;
    if (/must be after start/.test(e)) return `${which} ends before it starts.`;
    if (/^date must/.test(e)) return 'The date is missing or not YYYY-MM-DD.';
    if (/^timezone/.test(e))
      return 'The time zone is missing or not recognised (e.g. America/New_York).';
    if (/^version/.test(e)) return 'Add "version": 1 at the top.';
    if (/category/.test(e)) return `${which} has a category Persist doesn't know.`;
    if (/at most/.test(e)) return 'That is more meetings than one day can hold.';
    return e;
  });
  return [...new Set(out)];
}
