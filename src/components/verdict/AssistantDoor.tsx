'use client';

import { useState } from 'react';
import type { DayInput } from '../../lib/engine/types';
import { parseDayInput } from '../../lib/engine/parse';
import {
  ASSISTANTS,
  assistantPrompt,
  explainErrors,
  extractJson,
  type Assistant,
} from '../../lib/verdict/assistantPrompt';

const SURFACE = { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' } as const;

// "Ask your assistant": copy a prompt into Copilot / ChatGPT / Claude, paste
// the JSON it returns, get the verdict. Works where Persist can't connect.
export default function AssistantDoor({
  date,
  timezone,
  onDay,
  onCopy,
  onError,
}: {
  date: string;
  timezone: string;
  onDay: (input: DayInput) => void;
  onCopy?: (assistant: Assistant) => void;
  onError?: () => void;
}) {
  const [who, setWho] = useState<Assistant>('copilot');
  const [pasted, setPasted] = useState('');
  const [copied, setCopied] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const prompt = assistantPrompt(who, date, timezone);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      onCopy?.(who);
    } catch {
      setCopied(false);
    }
  };

  const submit = () => {
    const json = extractJson(pasted);
    if (json === null) {
      setProblems([
        "That doesn't look like the JSON reply. Paste everything your assistant sent back.",
      ]);
      onError?.();
      return;
    }
    const parsed = parseDayInput(json);
    if (!parsed.ok) {
      setProblems(explainErrors(parsed.errors));
      onError?.();
      return;
    }
    setProblems([]);
    onDay(parsed.input);
  };

  return (
    <div
      className="reveal-up rounded-2xl px-4 py-5"
      style={{ ...SURFACE, borderColor: 'var(--signal-edge)' }}
    >
      <h2
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--signal)' }}
      >
        Ask your assistant
      </h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        Your assistant already sees your work calendar. Ask it for today’s meeting times — no titles
        — and paste the answer here. Works even where Outlook won’t connect.
      </p>

      <div className="mt-4 flex gap-1.5" role="tablist" aria-label="Assistant">
        {ASSISTANTS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={who === a.id}
            onClick={() => {
              setWho(a.id);
              setCopied(false);
            }}
            className="flex-1 rounded-lg py-2 text-xs font-semibold"
            style={{
              backgroundColor: who === a.id ? 'var(--signal)' : 'transparent',
              color: who === a.id ? 'var(--ground)' : 'var(--text-muted)',
              border: `1px solid ${who === a.id ? 'var(--signal)' : 'var(--rule)'}`,
              minHeight: 40,
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      <ol className="mt-4 flex flex-col gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <li>
          <span style={{ color: 'var(--text)' }}>1.</span> Open{' '}
          {ASSISTANTS.find((a) => a.id === who)!.where} and paste this prompt.
          <button
            type="button"
            onClick={copy}
            className="mt-2 w-full rounded-lg py-3 text-sm font-semibold"
            style={{ backgroundColor: 'var(--signal)', color: 'var(--ground)' }}
          >
            {copied ? 'Prompt copied' : 'Copy prompt'}
          </button>
          <details className="mt-2">
            <summary className="cursor-pointer">See the prompt</summary>
            <pre
              className="mt-2 whitespace-pre-wrap text-[10px] leading-relaxed rounded-lg p-3"
              style={{ border: '1px solid var(--rule)', fontFamily: 'var(--font-geist-mono)' }}
            >
              {prompt}
            </pre>
          </details>
        </li>
        <li>
          <span style={{ color: 'var(--text)' }}>2.</span> Paste its reply.
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            aria-label="Your assistant's reply"
            placeholder='{ "version": 1, … }'
            rows={5}
            className="mt-2 w-full rounded-lg p-3 text-[11px] bg-transparent"
            style={{
              border: '1px solid var(--rule)',
              color: 'var(--text)',
              fontFamily: 'var(--font-geist-mono)',
            }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!pasted.trim()}
            className="mt-2 w-full rounded-lg py-3 text-sm font-semibold disabled:opacity-40"
            style={{ border: '1px solid var(--signal)', color: 'var(--signal)' }}
          >
            Get my verdict
          </button>
        </li>
      </ol>

      {problems.length > 0 && (
        <ul
          className="mt-3 flex flex-col gap-1 text-xs"
          role="alert"
          style={{ color: 'var(--text)' }}
        >
          {problems.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
