import PersistLogo from './PersistLogo';

/** Placeholder with the same silhouette as the card (mood row, scores, quote). */
export function CardSkeleton() {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, var(--surface-2), var(--surface))',
        border: '1px solid var(--rule)',
        padding: '28px 24px 24px',
      }}
      aria-hidden="true"
    >
      <div className="skeleton-bar rounded" style={{ height: 8, width: '38%', marginBottom: 26 }} />
      <div style={{ display: 'flex', gap: 22, marginBottom: 30 }}>
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="skeleton-bar rounded-md" style={{ height: 30, width: 50 }} />
            <div className="skeleton-bar rounded" style={{ height: 6, width: 44, marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div
        className="skeleton-bar rounded-md"
        style={{ height: 20, width: '92%', marginBottom: 10 }}
      />
      <div
        className="skeleton-bar rounded-md"
        style={{ height: 20, width: '64%', marginBottom: 18 }}
      />
      <div className="skeleton-bar rounded" style={{ height: 9, width: '46%', marginBottom: 22 }} />
      <div className="skeleton-bar rounded" style={{ height: 9, width: '80%', marginBottom: 26 }} />
      <div className="skeleton-bar rounded" style={{ height: 7, width: '30%' }} />
    </div>
  );
}

/** Full-page placeholder shown while the session or first dashboard load resolves. */
export default function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--ground)' }}
      role="status"
      aria-label="Loading your dashboard"
    >
      <header
        className="px-6 py-6 border-b"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--rule)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <PersistLogo size={24} variant="dark" />
          <span
            className="text-lg font-semibold"
            style={{ color: 'var(--text)', letterSpacing: '1.5px' }}
          >
            PERSIST<span style={{ color: 'var(--signal)' }}>WORK</span>
          </span>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-12">
        <section className="max-w-xs mx-auto">
          <CardSkeleton />
        </section>
      </div>
    </div>
  );
}
