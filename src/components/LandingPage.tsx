'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'

// Static demo week for the trends section — continues the Tuesday story from the demo card.
const TREND_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const TREND_TUESDAY = 1
const TREND_METRICS = [
  { name: 'Focus', values: [52, 14, 38, 61, 70], insight: 'Tuesday didn’t just cost Tuesday. Focus needed until Thursday to recover.' },
  { name: 'Strain', values: [44, 88, 71, 50, 38], insight: 'Strain stayed elevated all Wednesday — a stacked day bills you the next morning too.' },
  { name: 'Balance', values: [58, 31, 46, 60, 67], insight: 'Recovery arrived when the calendar made room for it — not before.' },
]

const SPARK_W = 280
const SPARK_H = 56
const SPARK_PX = 10
const SPARK_PY = 9

function sparkPath(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = (SPARK_W - SPARK_PX * 2) / (values.length - 1)
  const pts = values.map((v, i) => ({
    x: SPARK_PX + i * step,
    y: SPARK_PY + (1 - (v - min) / range) * (SPARK_H - SPARK_PY * 2),
  }))
  let line = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const cp = step * 0.35
    line += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`
  }
  const area = `${line} L${pts[pts.length - 1].x},${SPARK_H} L${pts[0].x},${SPARK_H} Z`
  return { line, area, pts }
}

export default function LandingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleGetStarted = () => {
    signIn('google')
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <style jsx global>{`
        html { scroll-behavior: smooth; }

        .lp-wrap {
          font-family: var(--font-geist-sans), -apple-system, sans-serif;
          background: var(--ground);
          color: var(--text);
          line-height: 1.6;
          min-height: 100vh;
        }

        /* NAV */
        .lp-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          background: var(--surface);
          border-bottom: 1px solid var(--rule);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .lp-logo {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.5px;
          color: var(--text);
        }
        .lp-logo span { color: var(--signal); }
        .lp-nav-links a,
        .lp-nav-links button {
          font-size: 14px;
          color: var(--text-muted);
          text-decoration: none;
          margin-left: 28px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .lp-nav-cta {
          background: var(--signal) !important;
          color: var(--ground) !important;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 700;
          margin-left: 28px !important;
          display: inline-block;
        }

        /* HERO */
        .lp-hero {
          text-align: center;
          padding: 80px 24px 64px;
          max-width: 700px;
          margin: 0 auto;
        }
        .lp-eyebrow {
          display: inline-block;
          background: var(--signal-soft);
          color: var(--signal);
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 24px;
          letter-spacing: 0.3px;
        }
        .lp-wrap h1 {
          font-size: clamp(36px, 6vw, 58px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1.5px;
          color: var(--text);
          margin-bottom: 20px;
        }
        .lp-wrap h1 em {
          font-style: normal;
          color: var(--signal);
        }
        .lp-hero-sub {
          font-size: 18px;
          color: var(--text-muted);
          max-width: 500px;
          margin: 0 auto 36px;
          line-height: 1.65;
        }
        .lp-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--signal);
          color: var(--ground);
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(199,249,92,0.35);
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .lp-hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(199,249,92,0.5);
        }
        .lp-hero-note {
          font-size: 13px;
          color: var(--text-faint);
          margin-top: 14px;
        }

        /* SECTION SHARED */
        .lp-section {
          padding: 72px 24px;
        }
        .lp-section-inner {
          max-width: 960px;
          margin: 0 auto;
        }
        .lp-section-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--signal);
          margin-bottom: 10px;
        }
        .lp-wrap h2 {
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 800;
          letter-spacing: -0.8px;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .lp-wrap h2 em {
          font-style: normal;
          color: var(--signal);
        }

        /* DEMO SECTION */
        .lp-demo-section {
          background: var(--surface);
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .lp-demo-intro {
          max-width: 580px;
          margin-bottom: 48px;
        }
        .lp-demo-intro p {
          color: var(--text-muted);
          font-size: 17px;
          line-height: 1.65;
        }
        .lp-demo-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        /* CALENDAR */
        .lp-cal {
          background: var(--surface-2);
          border: 1px solid var(--rule);
          border-radius: 16px;
          overflow: hidden;
        }
        .lp-cal-head {
          padding: 14px 18px;
          border-bottom: 1px solid var(--rule);
          font-weight: 700;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lp-cal-head span {
          color: var(--text-faint);
          font-weight: 400;
          font-size: 13px;
        }
        .lp-cal-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lp-time-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          min-height: 32px;
        }
        .lp-time-label {
          font-size: 11px;
          color: var(--text-faint);
          width: 32px;
          padding-top: 6px;
          flex-shrink: 0;
          text-align: right;
        }
        .lp-cal-slot { flex: 1; }
        .lp-event {
          border-radius: 7px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
          border-left: 3px solid transparent;
        }
        .lp-ev-amber,
        .lp-ev-sage,
        .lp-ev-slate,
        .lp-ev-rose,
        .lp-ev-plum {
          background: var(--surface-2);
          color: var(--text);
          border-color: var(--signal);
        }
        .lp-ev-sage { border-color: rgba(199,249,92,0.7); }
        .lp-ev-slate { border-color: rgba(199,249,92,0.5); }
        .lp-ev-rose { border-color: rgba(199,249,92,0.85); }
        .lp-ev-plum { border-color: rgba(199,249,92,0.6); }

        /* INSIGHTS */
        .lp-insights {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: space-between;
        }
        .lp-insight-card {
          background: var(--surface-2);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: transform 0.15s;
        }
        .lp-insight-card:hover { transform: translateX(3px); }
        .lp-ic-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--signal);
          flex-shrink: 0;
        }
        .lp-ic-amber { background: var(--signal-soft); }
        .lp-ic-rose { background: var(--signal-soft); }
        .lp-ic-sage { background: var(--signal-soft); }
        .lp-ic-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .lp-label-focus { color: var(--signal); }
        .lp-label-strain { color: var(--signal); }
        .lp-label-balance { color: var(--signal); }
        .lp-ic-text {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* SCORE ROW */
        .lp-score-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        .lp-score-pill {
          background: var(--surface-2);
          border: 1px solid var(--rule);
          border-radius: 10px;
          padding: 10px 12px;
          text-align: center;
          transition: transform 0.15s;
          cursor: default;
        }
        .lp-score-pill:hover { transform: translateY(-2px); }
        .lp-score-num {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -1px;
          font-variant-numeric: tabular-nums;
        }
        .lp-score-num.lp-amber { color: var(--signal); }
        .lp-score-num.lp-rose { color: var(--signal); }
        .lp-score-num.lp-sage { color: var(--signal); }
        .lp-score-lbl {
          font-size: 11px;
          color: var(--text-faint);
          font-weight: 500;
          margin-top: 1px;
        }

        /* MOOD PILL (replaces dark quote card) */
        .lp-mood-tag-row {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        .lp-mood-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 999px;
          background: var(--surface-2);
          color: var(--signal);
          border: 1px solid var(--signal-edge);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .lp-mood-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--signal);
          box-shadow: 0 0 8px rgba(199,249,92,0.55);
        }

        /* HOW IT WORKS */
        .lp-hiw-section { background: var(--ground); }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .lp-step {
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: 16px;
          padding: 28px 24px;
        }
        .lp-step-num {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--signal);
          margin-bottom: 16px;
        }
        .lp-step h3 {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }
        .lp-step p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* WHY SECTION */
        .lp-why-section {
          background: var(--surface);
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .lp-why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
          margin-top: 16px;
        }
        .lp-why-copy p {
          font-size: 16px;
          color: var(--text-muted);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .lp-why-copy strong { color: var(--text); }
        .lp-why-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lp-stat-card {
          background: var(--surface-2);
          border: 1px solid var(--rule);
          border-radius: 14px;
          padding: 20px 22px;
        }
        .lp-stat-num {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -1.5px;
          color: var(--signal);
          margin-bottom: 4px;
          font-variant-numeric: tabular-nums;
        }
        .lp-stat-desc {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* TRENDS */
        .lp-trends-section { background: var(--ground); }
        .lp-trend-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 40px;
        }
        .lp-trend-card {
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: 14px;
          padding: 18px 18px 16px;
        }
        .lp-trend-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .lp-trend-name {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--text);
        }
        .lp-trend-delta {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 13px;
          font-weight: 700;
          color: var(--signal);
          font-variant-numeric: tabular-nums;
        }
        .lp-trend-days {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          padding: 0 2px;
        }
        .lp-trend-days span {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-faint);
        }
        .lp-trend-days span.lp-trend-today {
          color: var(--signal);
          font-weight: 800;
        }
        .lp-trend-insight {
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-top: 12px;
        }

        /* CTA SECTION */
        .lp-cta-section {
          background: var(--ground);
          border-top: 1px solid var(--rule);
          text-align: center;
          padding: 80px 24px;
        }
        .lp-cta-section h2 { color: var(--text); margin-bottom: 16px; }
        .lp-cta-section h2 em { color: var(--signal); }
        .lp-cta-section p {
          color: var(--text-muted);
          font-size: 16px;
          max-width: 440px;
          margin: 0 auto 36px;
        }
        .lp-cta-note {
          color: var(--text-faint);
          font-size: 13px;
          margin-top: 14px;
        }

        /* FOOTER */
        .lp-footer {
          background: var(--ground);
          border-top: 1px solid var(--rule);
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lp-footer span {
          font-size: 13px;
          color: var(--text-faint);
        }
        .lp-footer-links {
          display: flex;
          gap: 20px;
        }
        .lp-footer-links a {
          font-size: 13px;
          color: var(--text-faint);
          text-decoration: none;
        }
        .lp-footer-links a:hover { color: var(--text-muted); }

        /* MOBILE MENU */
        .lp-mobile-menu {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 99;
          background: var(--surface);
          padding-top: 80px;
        }
        .lp-mobile-menu.open { display: block; }
        .lp-mobile-menu-inner {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lp-mobile-menu button,
        .lp-mobile-menu a {
          display: block;
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          background: none;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
        }
        .lp-mobile-menu button:hover,
        .lp-mobile-menu a:hover { background: var(--signal-soft); }
        .lp-mobile-cta {
          margin-top: 16px;
          background: var(--signal) !important;
          color: var(--ground) !important;
          text-align: center !important;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .lp-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        @media (max-width: 700px) {
          .lp-nav { padding: 16px 20px; }
          .lp-nav-links { display: none !important; }
          .lp-hamburger { display: block !important; }
          .lp-demo-wrap,
          .lp-steps,
          .lp-why-grid,
          .lp-trend-grid { grid-template-columns: 1fr; }
          .lp-footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>

      <div className="lp-wrap">
        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-logo">PERSIST<span>WORK</span></div>
          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => scrollToSection('how-it-works')}>How it works</button>
            <button onClick={() => scrollToSection('why-it-matters')}>Why it matters</button>
            <button onClick={handleGetStarted}>Sign in</button>
            <Link href="/sandbox" className="lp-nav-cta">See the demo &rarr;</Link>
          </div>
          <button
            className="lp-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`lp-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="lp-mobile-menu-inner">
            <button onClick={() => scrollToSection('how-it-works')}>How it works</button>
            <button onClick={() => scrollToSection('why-it-matters')}>Why it matters</button>
            <button onClick={handleGetStarted}>Sign in</button>
            <Link href="/sandbox" className="lp-mobile-cta" onClick={() => setMobileMenuOpen(false)}>See the demo &rarr;</Link>
          </div>
        </div>

        {/* HERO */}
        <section className="lp-section" style={{ padding: '80px 24px 64px' }}>
          <div className="lp-hero" style={{ padding: 0, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
            <h1>Your workday, <em>decoded.</em></h1>
            <p className="lp-hero-sub">
              Focus, Strain, and Balance &mdash; three daily scores. The focus you got, the load you carried, the recovery you didn&apos;t.
            </p>
            <button className="lp-hero-cta" onClick={handleGetStarted}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Unlock my scores
            </button>
            <p className="lp-hero-note">We only read event titles &amp; times</p>
          </div>
        </section>

        {/* DEMO */}
        <section className="lp-section lp-demo-section" id="demo">
          <div className="lp-section-inner">
            <div className="lp-demo-intro">
              <div className="lp-section-label">See it in action</div>
              <h2>Eight meetings. One break. <em>Zero flow.</em></h2>
              <p>A real kind of Tuesday. PERSISTWORK reads between the lines &mdash; and scores what the day actually took.</p>
            </div>

            <div className="lp-demo-wrap">
              {/* CALENDAR SIDE */}
              <div className="lp-cal">
                <div className="lp-cal-head">Tuesday, Mar 4 <span>8 events &middot; 7.5 hrs</span></div>
                <div className="lp-cal-body">
                  <div className="lp-time-row"><span className="lp-time-label">9am</span><div className="lp-cal-slot"><div className="lp-event lp-ev-amber">Sprint Planning</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">10</span><div className="lp-cal-slot"><div className="lp-event lp-ev-slate">Design Review</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">11</span><div className="lp-cal-slot"><div className="lp-event lp-ev-sage">Standup</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">12</span><div className="lp-cal-slot" style={{ height: 28 }}></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">1pm</span><div className="lp-cal-slot"><div className="lp-event lp-ev-rose">Client Sync</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">2</span><div className="lp-cal-slot"><div className="lp-event lp-ev-plum">Product Roadmap</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">3</span><div className="lp-cal-slot"><div className="lp-event lp-ev-amber">1:1 with Manager</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">4</span><div className="lp-cal-slot"><div className="lp-event lp-ev-rose">Quarterly Review</div></div></div>
                  <div className="lp-time-row"><span className="lp-time-label">5</span><div className="lp-cal-slot"><div className="lp-event lp-ev-slate">All-Hands</div></div></div>
                </div>
              </div>

              {/* INSIGHTS SIDE */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="lp-insights" style={{ flex: 1 }}>
                  <div className="lp-insight-card">
                    <div className="lp-ic-icon lp-ic-amber">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                    <div>
                      <div className="lp-ic-label lp-label-focus">Focus</div>
                      <div className="lp-ic-text">No uninterrupted block longer than 45 minutes. Deep work never had a chance today.</div>
                    </div>
                  </div>
                  <div className="lp-insight-card">
                    <div className="lp-ic-icon lp-ic-rose">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <div>
                      <div className="lp-ic-label lp-label-strain">Strain</div>
                      <div className="lp-ic-text">5 different contexts, back-to-back from 1&ndash;5pm. Your brain is paying the switching tax all afternoon.</div>
                    </div>
                  </div>
                  <div className="lp-insight-card">
                    <div className="lp-ic-icon lp-ic-sage">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div>
                      <div className="lp-ic-label lp-label-balance">Balance</div>
                      <div className="lp-ic-text">One 30-minute gap in a 7.5-hour day. You needed three. Your future self is already tired.</div>
                    </div>
                  </div>
                </div>

                <div className="lp-score-row">
                  <div className="lp-score-pill"><div className="lp-score-num lp-amber">14</div><div className="lp-score-lbl">Focus</div></div>
                  <div className="lp-score-pill"><div className="lp-score-num lp-rose">88</div><div className="lp-score-lbl">Strain</div></div>
                  <div className="lp-score-pill"><div className="lp-score-num lp-sage">31</div><div className="lp-score-lbl">Balance</div></div>
                </div>

                <div className="lp-mood-tag-row">
                  <div className="lp-mood-tag">
                    <span className="lp-mood-tag-dot"></span>
                    Survival Mode
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* TRENDS */}
        <section className="lp-section lp-trends-section" id="trends">
          <div className="lp-section-inner">
            <div className="lp-demo-intro">
              <div className="lp-section-label">The unlock</div>
              <h2>One day is a score.<br /><em>A week is a pattern.</em></h2>
              <p>Here&apos;s that Tuesday in context. A stacked day doesn&apos;t stay in its lane &mdash; it drags Focus down for days and keeps Strain elevated into the next morning. Trends make the cost visible, and the recovery measurable.</p>
            </div>
            <div className="lp-trend-grid">
              {TREND_METRICS.map(({ name, values, insight }) => {
                const { line, area, pts } = sparkPath(values)
                const tue = pts[TREND_TUESDAY]
                return (
                  <div className="lp-trend-card" key={name}>
                    <div className="lp-trend-head">
                      <span className="lp-trend-name">{name}</span>
                      <span className="lp-trend-delta">{values[TREND_TUESDAY]} &rarr; {values[values.length - 1]}</span>
                    </div>
                    <svg width="100%" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" style={{ display: 'block', color: 'var(--signal)' }} aria-hidden="true">
                      <path d={area} fill="currentColor" opacity={0.08} />
                      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={tue.x} cy={tue.y} r={5} fill="currentColor" opacity={0.15} />
                      <circle cx={tue.x} cy={tue.y} r={3} fill="currentColor" />
                    </svg>
                    <div className="lp-trend-days">
                      {TREND_DAYS.map((d, i) => (
                        <span key={d} className={i === TREND_TUESDAY ? 'lp-trend-today' : undefined}>{d}</span>
                      ))}
                    </div>
                    <p className="lp-trend-insight">{insight}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* WHY IT MATTERS */}
        <section className="lp-section lp-why-section" id="why-it-matters">
          <div className="lp-section-inner">
            <div className="lp-why-grid">
              <div className="lp-why-copy">
                <div className="lp-section-label">Why it matters</div>
                <h2>The exhaustion is real.<br />Now it&apos;s <em>measurable</em>.</h2>
                <p>Most calendar apps just show you <strong>what</strong> is happening. PERSISTWORK measures <strong>why your day felt the way it did</strong> &mdash; the fragmentation, the back-to-backs, the meetings that eat your thinking time.</p>
                <p>We&apos;re not here to fix your calendar (that&apos;s a different problem). We&apos;re here to name it, score it, and surface the patterns underneath.</p>
              </div>
              <div className="lp-why-stats">
                <div className="lp-stat-card">
                  <div className="lp-stat-num">4.8&times;</div>
                  <div className="lp-stat-desc">more context switches on a heavy meeting day vs. a focused one &mdash; and you feel every single one.</div>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-num">62%</div>
                  <div className="lp-stat-desc">of workers say they have no uninterrupted time to do their actual job on most days.</div>
                </div>
                <div className="lp-stat-card">
                  <div className="lp-stat-num">23 min</div>
                  <div className="lp-stat-desc">average uninterrupted block on a heavy meeting day. Deep work needs 90.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section lp-hiw-section" id="how-it-works">
          <div className="lp-section-inner">
            <div className="lp-section-label">How it works</div>
            <h2>Getting in takes <em>10 seconds</em></h2>
            <div className="lp-steps">
              <div className="lp-step">
                <div className="lp-step-num">STEP 01</div>
                <h3>Connect your calendar</h3>
                <p>Link Google Calendar in 10 seconds. We only read event titles and times &mdash; nothing else, ever.</p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">STEP 02</div>
                <h3>Get your daily card</h3>
                <p>Every morning, get your three scores &mdash; Focus, Strain, and Balance &mdash; built from the day ahead of you.</p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">STEP 03</div>
                <h3>Watch trends emerge</h3>
                <p>See Focus, Strain, and Balance compound across weeks. Patterns show up that you couldn&apos;t feel in the moment.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-cta-section">
          <div className="lp-section-inner" style={{ maxWidth: 600 }}>
            <h2>Your calendar is talking.<br /><em>Start listening.</em></h2>
            <p>Nothing to install, ten seconds of setup &mdash; then three scores that finally explain the day.</p>
            <button className="lp-hero-cta" onClick={handleGetStarted}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Unlock my scores
            </button>
            <p className="lp-cta-note">We only read event titles &amp; times</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <span>&copy; 2026 PERSISTWORK</span>
          <div className="lp-footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </>
  )
}
