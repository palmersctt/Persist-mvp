import { type Mood, MOODS, getMoodTier } from '../lib/mood';

// ─── score fields ───────────────────────────────────────────────────────────

const SCORE_FIELDS = [
  { key: 'value' as const, label: 'VALUE' },
  { key: 'strain' as const, label: 'STRAIN' },
  { key: 'fill' as const, label: 'FILL' },
];

// ─── token maps ─────────────────────────────────────────────────────────────

/** Tokens for dark-bg cards (bad + ok tier) */
const DARK_TOKENS = {
  popNum: 'rgba(199,249,92,0.95)',
  popLbl: 'rgba(199,249,92,0.6)',
  ghostNum: 'rgba(245,245,245,0.4)',
  ghostLbl: 'rgba(245,245,245,0.35)',
  flatNum: 'rgba(245,245,245,0.85)',
  flatLbl: 'rgba(245,245,245,0.55)',
  moodLabel: 'rgba(199,249,92,0.75)',
  dotColor: 'rgba(199,249,92,0.75)',
  dotGlow: '0 0 12px rgba(199,249,92,0.35)',
  quote: 'rgba(245,245,245,0.92)',
  source: 'rgba(245,245,245,0.6)',
  subtitle: 'rgba(245,245,245,0.65)',
  brandTxt: 'rgba(245,245,245,0.22)',
  brandAcc: 'rgba(199,249,92,0.6)',
  brandBg: 'rgba(245,245,245,0.07)',
  brandChev: 'rgba(245,245,245,0.3)',
  glowColor: 'rgba(199,249,92,0.08)',
  okMoodLabel: 'rgba(245,245,245,0.45)',
  okDotColor: 'rgba(245,245,245,0.45)',
  okBrandAcc: 'rgba(245,245,245,0.5)',
} as const;

/** Tokens for light-bg card (good tier — lime panel, near-black text) */
const LIGHT_TOKENS = {
  popNum: 'rgba(11,11,12,0.92)',
  popLbl: 'rgba(11,11,12,0.7)',
  ghostNum: 'rgba(11,11,12,0.45)',
  ghostLbl: 'rgba(11,11,12,0.38)',
  flatNum: 'rgba(11,11,12,0.65)',
  flatLbl: 'rgba(11,11,12,0.45)',
  moodLabel: 'rgba(11,11,12,0.75)',
  dotColor: 'rgba(11,11,12,0.75)',
  dotGlow: 'none',
  quote: 'rgba(11,11,12,0.9)',
  source: 'rgba(11,11,12,0.65)',
  subtitle: 'rgba(11,11,12,0.65)',
  brandTxt: 'rgba(11,11,12,0.32)',
  brandAcc: 'rgba(11,11,12,0.7)',
  brandBg: 'rgba(11,11,12,0.08)',
  brandChev: 'rgba(11,11,12,0.28)',
  glowColor: 'rgba(11,11,12,0.06)',
} as const;

// ─── component ───────────────────────────────────────────────────────────────

export interface CardContentProps {
  quote: string;
  source: string;
  subtitle: string;
  /** The verdict's three scores. Value leads (the headline). */
  value: number;
  strain: number;
  fill: number;
  mood: Mood;
  /** Short action label from the verdict — shown beside the mood name. */
  verdict?: string;
  daySummary?: string;
  cardRef?: (el: HTMLDivElement | null) => void;
  forExport?: boolean;
}

export default function CardContent({
  quote,
  source,
  subtitle,
  value,
  strain,
  fill,
  mood,
  verdict,
  cardRef,
  forExport = false,
}: CardContentProps) {
  const values = { value, strain, fill };
  const { gradient, name: moodName, textColor } = MOODS[mood];
  const tier = getMoodTier(mood);
  // Value is the verdict — it always leads; Strain and Fill sit flat beside it.
  const popped = { value: true, strain: false, fill: false };
  const isLight = textColor === 'dark';
  const isOk = tier === 'ok';

  const tk = isLight ? LIGHT_TOKENS : DARK_TOKENS;

  const cardBorder = forExport
    ? isLight
      ? '1px solid rgba(28,25,23,0.1)'
      : '1px solid rgba(255,255,255,0.08)'
    : isLight
      ? '1px solid rgba(28,25,23,0.08)'
      : '1px solid rgba(255,255,255,0.07)';

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        padding: '28px 24px 24px',
        position: 'relative',
        border: cardBorder,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '40%',
          transform: 'translate(-50%, -50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${tk.glowColor} 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Mood row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: isOk ? DARK_TOKENS.okDotColor : tk.dotColor,
            boxShadow: isOk ? 'none' : tk.dotGlow,
          }}
        />
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            margin: 0,
            color: isOk ? DARK_TOKENS.okMoodLabel : tk.moodLabel,
          }}
        >
          {moodName}
          {verdict ? <span> &middot; {verdict}</span> : null}
        </p>
      </div>

      {/* Scores — uniform 32px, color-driven emphasis. Value is the verdict,
          so it always pops; Strain and Fill sit flat beside it. */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 28, position: 'relative' }}>
        {SCORE_FIELDS.map((s) => {
          const isPopped = popped[s.key];
          const numColor = isOk ? DARK_TOKENS.flatNum : isPopped ? tk.popNum : tk.flatNum;
          const lblColor = isOk ? DARK_TOKENS.flatLbl : isPopped ? tk.popLbl : tk.flatLbl;
          const raw = values[s.key];
          const display = s.key === 'fill' ? `${raw >= 0 ? '+' : ''}${raw}` : `${raw}`;

          return (
            <div key={s.key} className="select-none">
              <div
                style={{
                  fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: numColor,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {display}
              </div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                  color: lblColor,
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote */}
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontStyle: 'italic',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          color: tk.quote,
          margin: '0 0 10px',
          position: 'relative',
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Source */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: tk.source,
          margin: '0 0 20px',
          position: 'relative',
        }}
      >
        {source}
      </p>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.5,
          color: tk.subtitle,
          margin: '0 0 22px',
          position: 'relative',
        }}
      >
        {subtitle}
      </p>

      {/* Brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <svg width={13} height={13} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" fill={tk.brandBg} />
          <path
            d="M38 30 L62 50 L38 70"
            stroke={tk.brandChev}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: tk.brandTxt }}>
          PERSIST<span style={{ color: isOk ? DARK_TOKENS.okBrandAcc : tk.brandAcc }}>WORK</span>
          <span style={{ fontWeight: 500 }}>.com</span>
        </span>
      </div>
    </div>
  );
}
