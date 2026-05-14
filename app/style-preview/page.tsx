'use client'

import Link from 'next/link'

export default function StylePreviewPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        body { margin: 0; }

        .sp-root {
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
        }
        .sp-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          background: #111;
          color: #f5f5f5;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sp-topbar a {
          color: #f5f5f5;
          text-decoration: none;
          opacity: 0.7;
        }
        .sp-topbar a:hover { opacity: 1; }

        .sp-block {
          padding: 72px 48px 96px;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .sp-block-inner {
          max-width: 1040px;
          margin: 0 auto;
          width: 100%;
        }
        .sp-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 6px 10px;
          border-radius: 4px;
          margin-bottom: 36px;
        }
        .sp-h1 {
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -1.5px;
          margin: 0 0 20px;
        }
        .sp-sub {
          font-size: 18px;
          line-height: 1.55;
          max-width: 560px;
          margin: 0 0 32px;
          opacity: 0.78;
        }
        .sp-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: default;
          font-family: inherit;
        }
        .sp-cta-note {
          margin-top: 14px;
          font-size: 12px;
          opacity: 0.55;
        }

        .sp-scores {
          margin-top: 56px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 560px;
        }
        .sp-score {
          padding: 18px 20px;
          border-radius: 12px;
        }
        .sp-score-num {
          font-size: 44px;
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .sp-score-lbl {
          margin-top: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .sp-mood {
          margin-top: 36px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .sp-mood-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* ============ DIRECTION A — PERFORMANCE / TRACKING ============ */
        .sp-a {
          background: #0B0B0C;
          color: #F5F5F5;
          font-family: 'Geist', 'Inter', sans-serif;
        }
        .sp-a .sp-tag {
          background: rgba(199,249,92,0.12);
          color: #C7F95C;
        }
        .sp-a .sp-h1 { font-weight: 700; letter-spacing: -2px; }
        .sp-a-accent { color: #C7F95C; }
        .sp-a .sp-cta {
          background: #C7F95C;
          color: #0B0B0C;
        }
        .sp-a .sp-score {
          background: #15161A;
          border: 1px solid #23252B;
        }
        .sp-a .sp-score-num {
          font-family: 'JetBrains Mono', monospace;
          color: #F5F5F5;
        }
        .sp-a .sp-score.is-hot .sp-score-num { color: #C7F95C; }
        .sp-a .sp-mood {
          background: #15161A;
          color: #C7F95C;
          border: 1px solid #23252B;
        }
        .sp-a .sp-mood-dot { background: #C7F95C; box-shadow: 0 0 10px rgba(199,249,92,0.6); }

        /* ============ DIRECTION B — EDITORIAL WELLNESS ============ */
        .sp-b {
          background: #EDEAE3;
          color: #1A1F1E;
          font-family: 'IBM Plex Sans', sans-serif;
        }
        .sp-b .sp-tag {
          background: rgba(14,92,91,0.1);
          color: #0E5C5B;
        }
        .sp-b .sp-h1 {
          font-family: 'Newsreader', serif;
          font-weight: 500;
          letter-spacing: -0.5px;
        }
        .sp-b .sp-h1 em {
          font-style: italic;
          color: #0E5C5B;
          font-weight: 500;
        }
        .sp-b-accent { color: #0E5C5B; }
        .sp-b .sp-cta {
          background: #0E5C5B;
          color: #EDEAE3;
        }
        .sp-b .sp-score {
          background: #F5F2EB;
          border: 1px solid #D8D3C8;
        }
        .sp-b .sp-score-num { color: #1A1F1E; font-weight: 600; }
        .sp-b .sp-score.is-hot .sp-score-num { color: #0E5C5B; }
        .sp-b .sp-mood {
          background: #1A1F1E;
          color: #EDEAE3;
        }
        .sp-b .sp-mood-dot { background: #0E5C5B; }

        /* ============ DIRECTION C — BLOOMBERG-Y DATA ============ */
        .sp-c {
          background: #FFFFFF;
          color: #111111;
          font-family: 'IBM Plex Sans', sans-serif;
          border-top: 1px solid #E5E5E5;
        }
        .sp-c .sp-tag {
          background: #F0F0F0;
          color: #111111;
          border: 1px solid #E0E0E0;
        }
        .sp-c .sp-h1 {
          font-weight: 700;
          letter-spacing: -1.5px;
        }
        .sp-c .sp-h1 em {
          font-style: normal;
          color: #7A1F2B;
          font-weight: 700;
        }
        .sp-c-accent { color: #7A1F2B; }
        .sp-c .sp-cta {
          background: #111111;
          color: #FFFFFF;
          border-radius: 4px;
        }
        .sp-c .sp-score {
          background: #FFFFFF;
          border: 1px solid #E5E5E5;
          border-radius: 4px;
        }
        .sp-c .sp-score-num {
          font-family: 'IBM Plex Mono', monospace;
          color: #111111;
          font-weight: 500;
        }
        .sp-c .sp-score.is-hot .sp-score-num { color: #7A1F2B; }
        .sp-c .sp-mood {
          background: #FFFFFF;
          color: #7A1F2B;
          border: 1px solid #7A1F2B;
          border-radius: 4px;
        }
        .sp-c .sp-mood-dot { background: #7A1F2B; }

        /* Notes column */
        .sp-notes {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid currentColor;
          opacity: 0.5;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          font-size: 12px;
          line-height: 1.5;
        }
        .sp-note-label {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
          font-size: 10px;
          opacity: 0.7;
        }
      `}</style>

      <div className="sp-root">
        <div className="sp-topbar">
          <span>Style preview &middot; Persistwork</span>
          <Link href="/">&larr; Back to landing</Link>
        </div>

        {/* ============ DIRECTION A ============ */}
        <section className="sp-block sp-a">
          <div className="sp-block-inner">
            <span className="sp-tag">Direction A &middot; Performance / Tracking</span>
            <h1 className="sp-h1">
              Your workday, <span className="sp-a-accent">decoded.</span>
            </h1>
            <p className="sp-sub">
              Focus, Strain, and Balance &mdash; three scores measured from your meetings, every day.
            </p>
            <button className="sp-cta">Connect your calendar &rarr;</button>
            <div className="sp-cta-note">Google Calendar &middot; Takes 10 seconds</div>

            <div className="sp-scores">
              <div className="sp-score"><div className="sp-score-num">14</div><div className="sp-score-lbl">Focus</div></div>
              <div className="sp-score is-hot"><div className="sp-score-num">88</div><div className="sp-score-lbl">Strain</div></div>
              <div className="sp-score"><div className="sp-score-num">31</div><div className="sp-score-lbl">Balance</div></div>
            </div>

            <div className="sp-mood">
              <span className="sp-mood-dot"></span>
              Survival Mode
            </div>

            <div className="sp-notes">
              <div>
                <div className="sp-note-label">Palette</div>
                #0B0B0C ground &middot; #C7F95C signal &middot; #15161A panels
              </div>
              <div>
                <div className="sp-note-label">Type</div>
                Geist sans &middot; JetBrains Mono on numerals
              </div>
              <div>
                <div className="sp-note-label">Reference</div>
                Whoop &middot; Strava Premium &middot; Linear
              </div>
            </div>
          </div>
        </section>

        {/* ============ DIRECTION B ============ */}
        <section className="sp-block sp-b">
          <div className="sp-block-inner">
            <span className="sp-tag">Direction B &middot; Editorial Wellness</span>
            <h1 className="sp-h1">
              Your workday, <em>decoded.</em>
            </h1>
            <p className="sp-sub">
              Focus, Strain, and Balance &mdash; three scores measured from your meetings, every day.
            </p>
            <button className="sp-cta">Connect your calendar &rarr;</button>
            <div className="sp-cta-note">Google Calendar &middot; Takes 10 seconds</div>

            <div className="sp-scores">
              <div className="sp-score"><div className="sp-score-num">14</div><div className="sp-score-lbl">Focus</div></div>
              <div className="sp-score is-hot"><div className="sp-score-num">88</div><div className="sp-score-lbl">Strain</div></div>
              <div className="sp-score"><div className="sp-score-num">31</div><div className="sp-score-lbl">Balance</div></div>
            </div>

            <div className="sp-mood">
              <span className="sp-mood-dot"></span>
              Survival Mode
            </div>

            <div className="sp-notes">
              <div>
                <div className="sp-note-label">Palette</div>
                #EDEAE3 bone &middot; #0E5C5B teal &middot; #1A1F1E ink
              </div>
              <div>
                <div className="sp-note-label">Type</div>
                Newsreader serif headlines &middot; IBM Plex Sans body
              </div>
              <div>
                <div className="sp-note-label">Reference</div>
                Headspace data &middot; Calm &middot; Eight Sleep
              </div>
            </div>
          </div>
        </section>

        {/* ============ DIRECTION C ============ */}
        <section className="sp-block sp-c">
          <div className="sp-block-inner">
            <span className="sp-tag">Direction C &middot; Bloomberg-y Data</span>
            <h1 className="sp-h1">
              Your workday, <em>decoded.</em>
            </h1>
            <p className="sp-sub">
              Focus, Strain, and Balance &mdash; three scores measured from your meetings, every day.
            </p>
            <button className="sp-cta">Connect your calendar &rarr;</button>
            <div className="sp-cta-note">Google Calendar &middot; Takes 10 seconds</div>

            <div className="sp-scores">
              <div className="sp-score"><div className="sp-score-num">14</div><div className="sp-score-lbl">Focus</div></div>
              <div className="sp-score is-hot"><div className="sp-score-num">88</div><div className="sp-score-lbl">Strain</div></div>
              <div className="sp-score"><div className="sp-score-num">31</div><div className="sp-score-lbl">Balance</div></div>
            </div>

            <div className="sp-mood">
              <span className="sp-mood-dot"></span>
              Survival Mode
            </div>

            <div className="sp-notes">
              <div>
                <div className="sp-note-label">Palette</div>
                #FFFFFF ground &middot; #7A1F2B oxblood &middot; #E5E5E5 rules
              </div>
              <div>
                <div className="sp-note-label">Type</div>
                IBM Plex Sans &middot; IBM Plex Mono on numerals
              </div>
              <div>
                <div className="sp-note-label">Reference</div>
                Stripe docs &middot; Bloomberg Terminal &middot; Modern Treasury
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
