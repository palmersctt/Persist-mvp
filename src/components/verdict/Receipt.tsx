import type { Receipt as ReceiptData } from '../../lib/verdict/story';

const SURFACE = { backgroundColor: 'var(--surface)', border: '1px solid var(--rule)' } as const;

// What the verdict was built from, and what never entered it.
export default function Receipt({ data }: { data: ReceiptData }) {
  return (
    <div className="rounded-xl px-4 py-3.5" style={SURFACE}>
      <p
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--signal)' }}
      >
        Receipt
      </p>
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt style={{ color: 'var(--text-faint)' }}>Used</dt>
        <dd style={{ color: 'var(--text)' }}>{data.used.join(' · ')}</dd>
        <dt style={{ color: 'var(--text-faint)' }}>Never</dt>
        <dd style={{ color: 'var(--text-muted)' }}>{data.notUsed.join(' · ')}</dd>
      </dl>
      <p className="mt-3 text-xs font-medium" style={{ color: 'var(--text)' }}>
        Scored in your browser. Your day was never uploaded.
      </p>
    </div>
  );
}
