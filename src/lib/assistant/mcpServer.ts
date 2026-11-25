// Persist's MCP server: four tools over a user's days. Built per request
// for one authenticated user (stateless). Server-only.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DayStore } from './store';
import { getTrend, getVerdict, logDay, rateDay, type ToolResult } from './tools';

const CATEGORY = z.enum([
  'BENEFICIAL',
  'NEUTRAL',
  'FOCUS_WORK',
  'LIGHT_MEETINGS',
  'HEAVY_MEETINGS',
  'COLLABORATIVE',
]);

const DAY = z
  .object({
    version: z.literal(1),
    date: z.string().describe("The user's local date, YYYY-MM-DD (today or yesterday)."),
    timezone: z.string().describe('IANA time zone, e.g. America/New_York.'),
    meetings: z
      .array(
        z.object({
          start: z.string().describe('ISO 8601 date-time WITH offset.'),
          end: z.string().describe('ISO 8601 date-time WITH offset.'),
          attendees: z.number().int().min(1).optional(),
          category: CATEGORY.optional().describe(
            'Pick a category instead of sending the title. FOCUS_WORK, BENEFICIAL (exercise, meals, family) and NEUTRAL (travel, out of office) are not counted as meetings.'
          ),
          organizerIsMe: z.boolean().optional(),
        })
      )
      .optional()
      .describe("Today's timed calendar events. Omit if unknown; [] for an empty day."),
    email: z
      .object({
        sent: z.number().int().min(0).optional(),
        sentAfterHours: z.number().int().min(0).optional(),
        received: z.number().int().min(0).optional(),
      })
      .optional()
      .describe('Counts only. Accepted, not scored yet.'),
    training: z
      .object({
        loadToday: z.number().min(0).optional(),
        baseline: z.number().min(0).optional(),
        weekActivityCount: z.number().int().min(0).optional(),
      })
      .optional(),
    sleep: z.object({ performance: z.number().min(0).max(100).optional() }).optional(),
    recovery: z.number().min(0).max(100).optional(),
  })
  .describe('One day of metadata. Never include titles, names, or message content.');

const reply = <T>(r: ToolResult<T>) =>
  r.ok
    ? { content: [{ type: 'text' as const, text: JSON.stringify(r.value) }] }
    : { content: [{ type: 'text' as const, text: r.error }], isError: true };

export function createPersistServer(store: DayStore, email: string, now = () => new Date()) {
  const server = new McpServer({ name: 'persist', version: '1.0.0' });

  server.registerTool(
    'log_day',
    {
      title: 'Score my day',
      description:
        "Send today's calendar metadata (and training or sleep if known) to get the user's readiness verdict against their own baseline: Survival, Grinding, Coasting, Locked In or Flow, with Readiness/Load/Balance scores, an action and the reasons. Send meeting times, attendee counts and a category per meeting — never titles, names or content. Lead your answer with the verdict and action; mention confidence when it isn't high.",
      inputSchema: { day: DAY },
    },
    async ({ day }) => reply(await logDay(store, email, day, now()))
  );

  server.registerTool(
    'get_verdict',
    {
      title: 'Get a logged verdict',
      description: "The verdict already logged for a day (default today in the user's zone).",
      inputSchema: {
        date: z.string().optional().describe('YYYY-MM-DD'),
        timezone: z.string().optional(),
      },
    },
    async (args) => reply(await getVerdict(store, email, args, now()))
  );

  server.registerTool(
    'get_trend',
    {
      title: 'Recent verdicts',
      description: 'Day-by-day verdicts, readiness and feel for the last 7 or 30 days.',
      inputSchema: {
        days: z.union([z.literal(7), z.literal(30)]).optional(),
        timezone: z.string().optional(),
      },
    },
    async (args) => reply(await getTrend(store, email, args, now()))
  );

  server.registerTool(
    'rate_day',
    {
      title: 'How did the day feel?',
      description:
        "Record how the day actually felt, 1–5 (Drained, Heavy, OK, Good, Great), for today or yesterday. Ask the user; don't guess.",
      inputSchema: {
        rating: z.number().int().min(1).max(5),
        date: z.string().optional().describe('YYYY-MM-DD, today or yesterday'),
        timezone: z.string().optional(),
      },
    },
    async (args) => reply(await rateDay(store, email, args, now()))
  );

  return server;
}
