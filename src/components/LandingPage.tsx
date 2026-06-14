'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleGetStarted = () => {
    signIn('google');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .lp-wrap {
          font-family:
            var(--font-geist-sans),
            -apple-system,
            sans-serif;
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
        .lp-logo span {
          color: var(--signal);
        }
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
          transition:
            transform 0.15s,
            box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(199, 249, 92, 0.35);
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .lp-hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(199, 249, 92, 0.5);
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
        .lp-cal-slot {
          flex: 1;
        }
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
        .lp-ev-sage {
          border-color: rgba(199, 249, 92, 0.7);
        }
        .lp-ev-slate {
          border-color: rgba(199, 249, 92, 0.5);
        }
        .lp-ev-rose {
          border-color: rgba(199, 249, 92, 0.85);
        }
        .lp-ev-plum {
          border-color: rgba(199, 249, 92, 0.6);
        }

        /* READINESS MOCK (mirrors the dashboard: card + why breakdown) */
        .lp-rstack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lp-rcard {
          background: linear-gradient(160deg, var(--surface-2), var(--surface));
          border: 1px solid var(--rule);
          border-radius: 14px;
          padding: 18px;
        }
        .lp-rcard-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--signal-dim);
          margin-bottom: 12px;
        }
        .lp-rcard-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--signal);
          box-shadow: 0 0 10px rgba(199, 249, 92, 0.5);
        }
        .lp-rcard-num {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 44px;
          font-weight: 700;
          letter-spacing: -2px;
          line-height: 1;
          color: var(--signal);
          font-variant-numeric: tabular-nums;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .lp-rcard-num span {
          font-family: var(--font-geist-sans), sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-faint);
        }
        .lp-rcard-sub {
          font-size: 11px;
          color: var(--text-faint);
          margin-top: 10px;
        }

        /* equation row */
        .lp-eq {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 12px 16px;
        }
        .lp-eq-term {
          text-align: center;
        }
        .lp-eq-num {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .lp-eq-num.lp-eq-muted {
          color: var(--text-muted);
        }
        .lp-eq-num.lp-eq-accent {
          color: var(--signal);
        }
        .lp-eq-lbl {
          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-faint);
          margin-top: 5px;
        }
        .lp-eq-op {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-faint);
        }

        /* why blocks */
        .lp-why-block {
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 14px 16px;
        }
        .lp-why-h {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text);
          margin-bottom: 12px;
        }
        .lp-why-tag {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--signal-soft);
          color: var(--signal-dim);
        }
        .lp-body-row {
          display: flex;
          justify-content: space-between;
        }
        .lp-body-item {
          text-align: center;
        }
        .lp-body-num {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 18px;
          font-weight: 700;
          color: var(--signal);
          font-variant-numeric: tabular-nums;
        }
        .lp-body-lbl {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-faint);
          margin-top: 2px;
        }
        .lp-cost {
          margin-bottom: 10px;
        }
        .lp-cost:last-child {
          margin-bottom: 0;
        }
        .lp-cost-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .lp-cost-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }
        .lp-cost-val {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 12px;
          font-weight: 400;
          color: var(--text-faint);
        }
        .lp-cost-pts {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 12px;
          font-weight: 600;
          color: var(--signal);
        }
        .lp-cost-bar {
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: var(--rule);
        }
        .lp-cost-fill {
          height: 4px;
          border-radius: 999px;
          background: var(--signal);
        }

        /* HOW IT WORKS */
        .lp-hiw-section {
          background: var(--ground);
        }
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

        /* AM/PM intelligence strip */
        .lp-ampm {
          max-width: 560px;
          margin: 36px auto 0;
          text-align: center;
        }
        .lp-ampm-lead {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .lp-ampm-row {
          display: inline-flex;
          align-items: center;
          gap: 18px;
        }
        .lp-ampm-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 14px 22px;
          min-width: 118px;
        }
        .lp-ampm-time {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-faint);
        }
        .lp-ampm-num {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 28px;
          font-weight: 800;
          color: var(--signal);
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .lp-ampm-verdict {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }
        .lp-ampm-arrow {
          color: var(--text-faint);
          font-size: 18px;
        }

        /* CTA SECTION */
        .lp-cta-section {
          background: var(--ground);
          border-top: 1px solid var(--rule);
          text-align: center;
          padding: 80px 24px;
        }
        .lp-cta-section h2 {
          color: var(--text);
          margin-bottom: 16px;
        }
        .lp-cta-section h2 em {
          color: var(--signal);
        }
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
        .lp-footer-links a:hover {
          color: var(--text-muted);
        }

        /* MOBILE MENU */
        .lp-mobile-menu {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 99;
          background: var(--surface);
          padding-top: 80px;
        }
        .lp-mobile-menu.open {
          display: block;
        }
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
        .lp-mobile-menu a:hover {
          background: var(--signal-soft);
        }
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
          .lp-nav {
            padding: 16px 20px;
          }
          .lp-nav-links {
            display: none !important;
          }
          .lp-hamburger {
            display: block !important;
          }
          .lp-demo-wrap,
          .lp-steps {
            grid-template-columns: 1fr;
          }
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
          <div className="lp-logo">
            PERSIST<span>WORK</span>
          </div>
          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => scrollToSection('how-it-works')}>How it works</button>
            <button onClick={handleGetStarted}>Sign in</button>
            <Link href="/sandbox" className="lp-nav-cta">
              See the demo &rarr;
            </Link>
          </div>
          <button
            className="lp-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div className={`lp-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="lp-mobile-menu-inner">
            <button onClick={() => scrollToSection('how-it-works')}>How it works</button>
            <button onClick={handleGetStarted}>Sign in</button>
            <Link
              href="/sandbox"
              className="lp-mobile-cta"
              onClick={() => setMobileMenuOpen(false)}
            >
              See the demo &rarr;
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section className="lp-section" style={{ padding: '80px 24px 64px' }}>
          <div
            className="lp-hero"
            style={{ padding: 0, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}
          >
            <div className="lp-eyebrow">For working athletes</div>
            <h1>
              Some days work is
              <br />
              <em>the workout.</em>
            </h1>
            <p className="lp-hero-sub">
              Until now you&apos;ve guessed how much work took out of you. Persistwork reads your
              day and answers the only question that matters: how hard to train today.
            </p>
            <button className="lp-hero-cta" onClick={handleGetStarted}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
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
              <h2>
                Eight meetings. A hard session. <em>One verdict.</em>
              </h2>
              <p>
                A real working-athlete Tuesday. Persistwork weighs the whole day &mdash; work and
                training &mdash; against what you&apos;re built for, and answers one question: how
                hard to train today.
              </p>
            </div>

            <div className="lp-demo-wrap">
              {/* CALENDAR SIDE */}
              <div className="lp-cal">
                <div className="lp-cal-head">
                  Tuesday, Mar 4 <span>8 meetings &middot; intervals at 6</span>
                </div>
                <div className="lp-cal-body">
                  <div className="lp-time-row">
                    <span className="lp-time-label">9am</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-amber">Sprint Planning</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">10</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-slate">Design Review</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">11</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-sage">Standup</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">12</span>
                    <div className="lp-cal-slot" style={{ height: 28 }}></div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">1pm</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-rose">Client Sync</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">2</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-plum">Product Roadmap</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">3</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-amber">1:1 with Manager</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">4</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-rose">Quarterly Review</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">5</span>
                    <div className="lp-cal-slot">
                      <div className="lp-event lp-ev-slate">All-Hands</div>
                    </div>
                  </div>
                  <div className="lp-time-row">
                    <span className="lp-time-label">6</span>
                    <div className="lp-cal-slot">
                      <div
                        className="lp-event"
                        style={{
                          borderLeft: '3px dashed var(--signal)',
                          background: 'var(--signal-soft)',
                          color: 'var(--text)',
                        }}
                      >
                        Intervals (planned)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* READINESS SIDE — mirrors the dashboard: card + why breakdown */}
              <div className="lp-rstack">
                {/* Readiness verdict card */}
                <div className="lp-rcard">
                  <div className="lp-rcard-chip">
                    <span className="lp-rcard-dot"></span>Flow &middot; Train normally
                  </div>
                  <div className="lp-rcard-num">
                    74<span>Value</span>
                  </div>
                  <div className="lp-rcard-sub">Value 74 &middot; Strain 38 &middot; Fill +17</div>
                </div>

                {/* The relationship: recent load vs the baseline you're built for */}
                <div className="lp-eq">
                  <div className="lp-eq-term">
                    <div className="lp-eq-num">108</div>
                    <div className="lp-eq-lbl">Recent</div>
                  </div>
                  <span className="lp-eq-op">&divide;</span>
                  <div className="lp-eq-term">
                    <div className="lp-eq-num lp-eq-muted">104</div>
                    <div className="lp-eq-lbl">Baseline</div>
                  </div>
                  <span className="lp-eq-op">=</span>
                  <div className="lp-eq-term">
                    <div className="lp-eq-num lp-eq-accent">1.04&times;</div>
                    <div className="lp-eq-lbl">In your band</div>
                  </div>
                </div>

                {/* Your training — load vs the baseline */}
                <div className="lp-why-block">
                  <div className="lp-why-h">
                    <span>Your training</span>
                    <span className="lp-why-tag">STRAVA</span>
                  </div>
                  <div className="lp-body-row">
                    <div className="lp-body-item">
                      <div className="lp-body-num">40</div>
                      <div className="lp-body-lbl">Baseline</div>
                    </div>
                    <div className="lp-body-item">
                      <div className="lp-body-num">4</div>
                      <div className="lp-body-lbl">This week</div>
                    </div>
                    <div className="lp-body-item">
                      <div className="lp-body-num">64</div>
                      <div className="lp-body-lbl">Today</div>
                    </div>
                  </div>
                </div>

                {/* Your workday — the scores that set your Work Index */}
                <div className="lp-why-block">
                  <div className="lp-why-h">
                    <span>Your workday</span>
                    <span className="lp-why-tag">WORK INDEX 59</span>
                  </div>
                  {[
                    { label: 'Focus', value: 70, width: 70 },
                    { label: 'Balance', value: 60, width: 60 },
                    { label: 'Strain', value: 50, width: 50 },
                  ].map((m) => (
                    <div className="lp-cost" key={m.label}>
                      <div className="lp-cost-head">
                        <span className="lp-cost-name">
                          {m.label} <span className="lp-cost-val">{m.value}</span>
                        </span>
                      </div>
                      <div className="lp-cost-bar">
                        <div className="lp-cost-fill" style={{ width: `${m.width}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Same session, opposite call — read against your baseline */}
            <div className="lp-ampm">
              <div className="lp-ampm-lead">
                Same hard session today &mdash; opposite verdict. Persistwork reads it against what
                you&apos;re built for, not a one-size rule. Three hard days only count if they
                exceed your baseline.
              </div>
              <div className="lp-ampm-row">
                <div className="lp-ampm-cell">
                  <span className="lp-ampm-time">Off the couch</span>
                  <span className="lp-ampm-num">25</span>
                  <span className="lp-ampm-verdict">Recover</span>
                </div>
                <span className="lp-ampm-arrow">&rarr;</span>
                <div className="lp-ampm-cell">
                  <span className="lp-ampm-time">4&ndash;5&times;/week</span>
                  <span className="lp-ampm-num">74</span>
                  <span className="lp-ampm-verdict">Train normally</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section lp-hiw-section" id="how-it-works">
          <div className="lp-section-inner">
            <div className="lp-section-label">How it works</div>
            <h2>
              Getting in takes <em>10 seconds</em>
            </h2>
            <div className="lp-steps">
              <div className="lp-step">
                <div className="lp-step-num">STEP 01</div>
                <h3>Connect your calendar</h3>
                <p>
                  Link Google Calendar in 10 seconds. We only read event titles and times &mdash;
                  nothing else, ever. That&apos;s the forecast.
                </p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">STEP 02</div>
                <h3>Connect Strava</h3>
                <p>
                  Your training history sets your baseline &mdash; what you&apos;re built for
                  &mdash; so today&apos;s load is judged against it, not a generic rule. No Strava
                  yet? Demo data walks the whole flow.
                </p>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">STEP 03</div>
                <h3>Get the verdict</h3>
                <p>
                  One verdict from the whole day &mdash; work and training measured against your
                  baseline. It tells you which it is: go hard, keep it moderate, or recover.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-cta-section">
          <div className="lp-section-inner" style={{ maxWidth: 600 }}>
            <h2>
              Stop guessing at 5pm.
              <br />
              <em>Train on the verdict.</em>
            </h2>
            <p>
              Connect your calendar, add Strava, and get one honest verdict on how hard to train
              today. Ten seconds of setup.
            </p>
            <button className="lp-hero-cta" onClick={handleGetStarted}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
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
  );
}
