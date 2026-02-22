interface ShareCardProps {
  quote: string;
  source: string;
  subtitle: string;
  performance: number;
  resilience: number;
  sustainability: number;
  onMetricClick?: (metric: 'performance' | 'resilience' | 'sustainability') => void;
}

const scores = [
  { key: 'performance', label: 'PERFORMANCE', color: '#10b981' },
  { key: 'resilience', label: 'RESILIENCE', color: '#3b82f6' },
  { key: 'sustainability', label: 'SUSTAINABILITY', color: '#6b7280' },
] as const;

export default function ShareCard({ quote, source, subtitle, performance, resilience, sustainability, onMetricClick }: ShareCardProps) {
  const values = { performance, resilience, sustainability };

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(17,17,17,0.9) 50%, rgba(10,10,10,0.9) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '40px 28px 36px',
      }}
    >
      {/* Quote */}
      <p className="text-2xl md:text-3xl lg:text-4xl font-light text-center gradient-text leading-tight" style={{ opacity: 0.85 }}>
        &ldquo;{quote}&rdquo;
      </p>

      {/* Source */}
      <p className="text-sm mt-3 mb-4 text-center font-normal italic" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
        &mdash; {source}
      </p>

      {/* Subtitle */}
      <p className="text-sm md:text-base text-center font-light leading-relaxed" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
        {subtitle}
      </p>

      {/* Divider */}
      <div className="w-16 h-0.5 mx-auto mt-6 mb-7" style={{ backgroundColor: '#25d366', opacity: 0.6 }} />

      {/* Score strip */}
      <div className="flex justify-center gap-8 md:gap-12">
        {scores.map((s) => (
          <div
            key={s.key}
            className="text-center cursor-pointer transition-opacity duration-200 hover:opacity-80"
            onClick={() => onMetricClick?.(s.key)}
          >
            <div className="text-3xl md:text-4xl font-semibold" style={{ color: s.color, lineHeight: 1 }}>
              {values[s.key]}
            </div>
            <div className="text-xs sm:text-sm uppercase tracking-wider mt-2" style={{ color: s.color }}>
              {s.label}
            </div>
            <div className="w-20 md:w-24 h-1 rounded-full mt-2.5 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: `${values[s.key]}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Branding */}
      <p className="text-xs text-center mt-7 tracking-widest uppercase" style={{ color: '#666666' }}>
        persist
      </p>
    </div>
  );
}
