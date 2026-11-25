import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPersistServer } from './mcpServer';
import { memoryStore } from './store';

const NOW = new Date('2026-11-25T20:00:00Z');

async function connect() {
  const store = memoryStore();
  const server = createPersistServer(store, 'me@example.com', () => NOW);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  return { client, store };
}

const text = (r: unknown) => (r as { content: { text: string }[] }).content[0].text;

describe('Persist MCP server', () => {
  it('offers the four tools', async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'get_trend',
      'get_verdict',
      'log_day',
      'rate_day',
    ]);
    const logDay = tools.find((t) => t.name === 'log_day');
    expect(logDay?.description).toMatch(/never titles/);
  });

  it('scores a day through log_day', async () => {
    const { client, store } = await connect();
    const r = await client.callTool({
      name: 'log_day',
      arguments: {
        day: {
          version: 1,
          date: '2026-11-25',
          timezone: 'America/New_York',
          meetings: [
            {
              start: '2026-11-25T09:00:00-05:00',
              end: '2026-11-25T10:00:00-05:00',
              category: 'COLLABORATIVE',
            },
          ],
        },
      },
    });
    expect(r.isError).toBeFalsy();
    expect(JSON.parse(text(r)).verdict).toBeTruthy();
    expect(store.rows.size).toBe(1);
  });

  it('returns errors the assistant can relay', async () => {
    const { client } = await connect();
    const r = await client.callTool({ name: 'get_verdict', arguments: { date: '2026-11-25' } });
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/Call log_day first/);
  });
});
