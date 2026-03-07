'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to dashboard if already logged in
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital@0;1&display=swap');

        :root {
          --cream: #FBF7F2;
          --warm-white: #FEFCF9;
          --ink: #1C1917;
          --ink-light: #57534E;
          --ink-faint: #A8A29E;
          --amber: #E87D3A;
          --amber-light: #FDF0E6;
          --amber-pale: #FEF8F2;
          --sage: #5A7A5C;
          --sage-light: #EBF2EB;
          --rose: #C0544A;
          --rose-light: #FAEAE9;
          --border: #E7E0D8;
        }

        html { scroll-behavior: smooth; }

        .lp-wrap {
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          line-height: 1.6;
          min-height: 100vh;
        }

        /* NAV */
        .lp-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          background: var(--warm-white);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .lp-logo {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.5px;
          color: var(--ink);
        }
        .lp-logo span { color: var(--amber); }
        .lp-nav-links a,
        .lp-nav-links button {
          font-size: 14px;
          color: var(--ink-light);
          text-decoration: none;
          margin-left: 28px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .lp-nav-cta {
          background: var(--amber) !important;
          color: white !important;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          margin-left: 28px !important;
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
          background: var(--amber-light);
          color: var(--amber);
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
          color: var(--ink);
          margin-bottom: 20px;
        }
        .lp-wrap h1 em {
          font-family: 'Lora', serif;
          font-style: italic;
          color: var(--amber);
        }
        .lp-hero-sub {
          font-size: 18px;
          color: var(--ink-light);
          max-width: 500px;
          margin: 0 auto 36px;
          line-height: 1.65;
        }
        .lp-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--amber);
          color: white;
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(232,125,58,0.35);
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .lp-hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(232,125,58,0.45);
        }
        .lp-hero-note {
          font-size: 13px;
          color: var(--ink-faint);
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
          color: var(--amber);
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
          font-family: 'Lora', serif;
          font-style: italic;
          color: var(--amber);
        }

        /* DEMO SECTION */
        .lp-demo-section {
          background: var(--warm-white);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .lp-demo-intro {
          max-width: 580px;
          margin-bottom: 48px;
        }
        .lp-demo-intro p {
          color: var(--ink-light);
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
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .lp-cal-head {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          font-weight: 700;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lp-cal-head span {
          color: var(--ink-faint);
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
          color: var(--ink-faint);
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
        .lp-ev-amber { background: #FEF0E0; border-color: #E8883A; color: #92470A; }
        .lp-ev-sage { background: #E8F2E8; border-color: #5A8A5C; color: #2D5430; }
        .lp-ev-slate { background: #EEF2F5; border-color: #7A9BB5; color: #2E5068; }
        .lp-ev-rose { background: #FAEBE9; border-color: #C46055; color: #7A2820; }
        .lp-ev-plum { background: #F0EAF7; border-color: #8B6AB5; color: #4A2878; }

        /* INSIGHTS */
        .lp-insights {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-insight-card {
          background: var(--cream);
          border: 1px solid var(--border);
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
          font-size: 16px;
          flex-shrink: 0;
        }
        .lp-ic-amber { background: var(--amber-light); }
        .lp-ic-rose { background: var(--rose-light); }
        .lp-ic-sage { background: var(--sage-light); }
        .lp-ic-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .lp-label-focus { color: var(--amber); }
        .lp-label-strain { color: var(--rose); }
        .lp-label-balance { color: var(--sage); }
        .lp-ic-text {
          font-size: 13px;
          color: var(--ink-light);
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
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          text-align: center;
        }
        .lp-score-num {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -1px;
        }
        .lp-score-num.lp-amber { color: var(--amber); }
        .lp-score-num.lp-rose { color: var(--rose); }
        .lp-score-num.lp-sage { color: var(--sage); }
        .lp-score-lbl {
          font-size: 11px;
          color: var(--ink-faint);
          font-weight: 500;
          margin-top: 1px;
        }

        /* DEMO RESULT (card below grid) */
        .lp-demo-arrow {
          text-align: center;
          font-size: 20px;
          color: var(--ink-faint);
          margin: 20px 0 4px;
          line-height: 1;
        }
        .lp-demo-result {
          max-width: 380px;
          margin: 0 auto;
        }

        /* QUOTE CARD v4 (bad tier — deepened dark ink) */
        .lp-quote-card {
          background: linear-gradient(160deg, #0E0C0B, #1C1917);
          border-radius: 16px;
          padding: 28px 24px 24px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .lp-qc-glow {
          position: absolute;
          top: 35%;
          left: 40%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,125,58,0.07) 0%, transparent 50%);
          pointer-events: none;
        }
        .lp-qc-mood {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          position: relative;
        }
        .lp-qc-mood-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(232,125,58,0.7);
          box-shadow: 0 0 12px rgba(232,125,58,0.3);
        }
        .lp-qc-mood-label {
          text-transform: uppercase;
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: rgba(232,125,58,0.7);
          margin: 0;
        }
        .lp-qc-scores {
          display: flex;
          gap: 22px;
          margin-bottom: 28px;
          position: relative;
        }
        .lp-qc-score-num {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .lp-qc-score-num.lp-qc-pop {
          color: rgba(232,125,58,0.9);
        }
        .lp-qc-score-num.lp-qc-ghost {
          color: rgba(255,255,255,0.22);
        }
        .lp-qc-score-lbl {
          text-transform: uppercase;
          font-weight: 700;
          font-size: 8px;
          letter-spacing: 0.14em;
          margin-top: 4px;
        }
        .lp-qc-score-lbl.lp-qc-pop-lbl {
          color: rgba(232,125,58,0.55);
        }
        .lp-qc-score-lbl.lp-qc-ghost-lbl {
          color: rgba(255,255,255,0.18);
        }
        .lp-qc-text {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.3;
          color: rgba(255,255,255,0.92);
          margin-bottom: 10px;
          letter-spacing: -0.01em;
          font-style: italic;
          position: relative;
        }
        .lp-qc-source {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 20px;
          font-weight: 500;
          position: relative;
        }
        .lp-qc-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.38);
          line-height: 1.5;
          font-weight: 400;
          margin-bottom: 22px;
          position: relative;
        }
        .lp-qc-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }
        .lp-qc-brand span {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.22);
        }
        .lp-qc-brand .lp-qc-acc {
          color: rgba(232,125,58,0.55);
        }
        .lp-qc-brand .lp-qc-dotcom {
          font-weight: 500;
        }

        /* HOW IT WORKS */
        .lp-hiw-section { background: var(--cream); }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .lp-step {
          background: var(--warm-white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 24px;
        }
        .lp-step-num {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--amber);
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
          color: var(--ink-light);
          line-height: 1.6;
        }

        /* WHY SECTION */
        .lp-why-section {
          background: var(--warm-white);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
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
          color: var(--ink-light);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .lp-why-copy strong { color: var(--ink); }
        .lp-why-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lp-stat-card {
          background: var(--cream);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 22px;
        }
        .lp-stat-num {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -1px;
          color: var(--amber);
          margin-bottom: 4px;
        }
        .lp-stat-desc {
          font-size: 14px;
          color: var(--ink-light);
          line-height: 1.5;
        }

        /* CTA SECTION */
        .lp-cta-section {
          background: var(--ink);
          text-align: center;
          padding: 80px 24px;
        }
        .lp-cta-section h2 { color: white; margin-bottom: 16px; }
        .lp-cta-section h2 em { color: var(--amber); }
        .lp-cta-section p {
          color: #A8A29E;
          font-size: 16px;
          max-width: 440px;
          margin: 0 auto 36px;
        }
        .lp-cta-note {
          color: #6B6560;
          font-size: 13px;
          margin-top: 14px;
        }

        /* FOOTER */
        .lp-footer {
          background: var(--ink);
          border-top: 1px solid #2C2724;
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lp-footer span {
          font-size: 13px;
          color: #6B6560;
        }
        .lp-footer-links {
          display: flex;
          gap: 20px;
        }
        .lp-footer-links a {
          font-size: 13px;
          color: #6B6560;
          text-decoration: none;
        }
        .lp-footer-links a:hover { color: #A8A29E; }

        /* MOBILE MENU */
        .lp-mobile-menu {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 99;
          background: var(--warm-white);
          padding-top: 80px;
        }
        .lp-mobile-menu.open { display: block; }
        .lp-mobile-menu-inner {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lp-mobile-menu button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
          background: none;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
        }
        .lp-mobile-menu button:hover { background: var(--amber-light); }
        .lp-mobile-cta {
          margin-top: 16px;
          background: var(--amber) !important;
          color: white !important;
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
          .lp-why-grid { grid-template-columns: 1fr; }
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
            <button className="lp-nav-cta" onClick={handleGetStarted}>Try free &rarr;</button>
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
            <button className="lp-mobile-cta" onClick={handleGetStarted}>Try free &rarr;</button>
          </div>
        </div>

        {/* HERO */}
        <section className="lp-section" style={{ padding: '80px 24px 64px' }}>
          <div className="lp-hero" style={{ padding: 0, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
<h1>Your calendar has a<br /><em>lot</em> to say about you.</h1>
            <p className="lp-hero-sub">
              PERSISTWORK reads your day, surfaces what&apos;s actually draining you, and finds a laugh that fits &mdash; because the least your calendar owes you is a joke.
            </p>
            <button className="lp-hero-cta" onClick={handleGetStarted}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Connect your calendar &mdash; it&apos;s free
            </button>
            <p className="lp-hero-note">Google Calendar &middot; Takes 10 seconds &middot; We only read titles &amp; times</p>
          </div>
        </section>

        {/* DEMO */}
        <section className="lp-section lp-demo-section" id="demo">
          <div className="lp-section-inner">
            <div className="lp-demo-intro">
              <div className="lp-section-label">See it in action</div>
              <h2>A day in the life of <em>your</em> calendar</h2>
              <p>This is a real kind of Tuesday. Eight meetings, one break, zero flow. PERSISTWORK reads between the lines and tells you what&apos;s actually going on.</p>
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
              <div>
                <div className="lp-insights">
                  <div className="lp-insight-card">
                    <div className="lp-ic-icon lp-ic-amber">&#129521;</div>
                    <div>
                      <div className="lp-ic-label lp-label-focus">Focus</div>
                      <div className="lp-ic-text">No uninterrupted block longer than 45 minutes. Deep work never had a chance today.</div>
                    </div>
                  </div>
                  <div className="lp-insight-card">
                    <div className="lp-ic-icon lp-ic-rose">&#128293;</div>
                    <div>
                      <div className="lp-ic-label lp-label-strain">Strain</div>
                      <div className="lp-ic-text">5 different contexts, back-to-back from 1&ndash;5pm. Your brain is paying the switching tax all afternoon.</div>
                    </div>
                  </div>
                  <div className="lp-insight-card">
                    <div className="lp-ic-icon lp-ic-sage">&#9878;&#65039;</div>
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

              </div>
            </div>

            <div className="lp-demo-arrow">&darr;</div>
            <div className="lp-demo-result">
              <div className="lp-quote-card">
                <div className="lp-qc-glow"></div>
                <div className="lp-qc-mood">
                  <div className="lp-qc-mood-dot"></div>
                  <p className="lp-qc-mood-label">Survival Mode</p>
                </div>
                <div className="lp-qc-scores">
                  <div><div className="lp-qc-score-num lp-qc-ghost">14</div><div className="lp-qc-score-lbl lp-qc-ghost-lbl">Focus</div></div>
                  <div><div className="lp-qc-score-num lp-qc-pop">88</div><div className="lp-qc-score-lbl lp-qc-pop-lbl">Strain</div></div>
                  <div><div className="lp-qc-score-num lp-qc-ghost">31</div><div className="lp-qc-score-lbl lp-qc-ghost-lbl">Balance</div></div>
                </div>
                <div className="lp-qc-text">&ldquo;I&apos;m melting! Melting!&rdquo;</div>
                <div className="lp-qc-source">&mdash; The Wizard of Oz &middot; Wicked Witch</div>
                <div className="lp-qc-subtitle">Back-to-backs from 9 to 5. You didn&apos;t have a day, you had a schedule.</div>
                <div className="lp-qc-brand">
                  <svg width="13" height="13" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.07)" /><path d="M38 30 L62 50 L38 70" stroke="rgba(255,255,255,0.3)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                  <span>PERSIST<span className="lp-qc-acc">WORK</span><span className="lp-qc-dotcom">.com</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section lp-hiw-section" id="how-it-works">
          <div className="lp-section-inner">
            <div className="lp-section-label">How it works</div>
            <h2>Three steps to finally <em>seeing</em> your day</h2>
            <div className="lp-steps">
              <div className="lp-step">
                <div className="lp-step-num">STEP 01</div>
                <h3>Connect your calendar</h3>
                <p>Link Google Calendar in 10 seconds. We only read event titles and times &mdash; nothing else, ever.</p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">STEP 02</div>
                <h3>Get your daily card</h3>
                <p>Every morning, three scores land in your inbox: Focus, Strain, and Balance &mdash; plus a quote that nails the vibe.</p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">STEP 03</div>
                <h3>Send it to someone who gets it</h3>
                <p>One tap to share. Because some days the only thing that helps is knowing a colleague sees it too.</p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY IT MATTERS */}
        <section className="lp-section lp-why-section" id="why-it-matters">
          <div className="lp-section-inner">
            <div className="lp-why-grid">
              <div className="lp-why-copy">
                <div className="lp-section-label">Why it matters</div>
                <h2>The exhaustion is real.<br />Now it&apos;s <em>visible</em>.</h2>
                <p>Most calendar apps just show you <strong>what</strong> is happening. PERSISTWORK tells you <strong>why you feel the way you do</strong> &mdash; the fragmentation, the back-to-backs, the meetings that eat your thinking time.</p>
                <p>We&apos;re not here to fix your calendar (that&apos;s a different problem). We&apos;re here to name it, score it, and help you laugh instead of spiral.</p>
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
                  <div className="lp-stat-num">1 laugh</div>
                  <div className="lp-stat-desc">is sometimes the only honest response to a calendar that looks like Tuesday.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-cta-section">
          <div className="lp-section-inner" style={{ maxWidth: 600 }}>
            <h2>Your calendar is talking.<br /><em>Start listening.</em></h2>
            <p>Free to try. No credit card. Just a calendar, three scores, and a laugh you probably need.</p>
            <button className="lp-hero-cta" onClick={handleGetStarted}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Connect your calendar &mdash; it&apos;s free
            </button>
            <p className="lp-cta-note">Google Calendar &middot; Takes 10 seconds &middot; We only read titles &amp; times</p>
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
