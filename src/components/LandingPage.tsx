'use client';

import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import CardContent from './CardContent';
import { useCountUp } from '../hooks/useCountUp';
import { HERO_DECK, HERO_FRONT_INDEX, deckSlot, stepDeck } from '../lib/heroDeck';
import './LandingPage.css';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero deck: one example card per verdict. Flow opens in front (the same
  // verdict the demo below arrives at) and its scores count up once.
  const flow = HERO_DECK[HERO_FRONT_INDEX];
  const heroReadiness = useCountUp(flow.readiness, { delay: 500 });
  const heroLoad = useCountUp(flow.load, { delay: 500 });
  const heroBalance = useCountUp(flow.balance, { delay: 500 });
  const [front, setFront] = useState(HERO_FRONT_INDEX);
  const [fanned, setFanned] = useState(false);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-200, 200], [-8, 8]);

  // Fan the back cards out just after first paint.
  useEffect(() => {
    const t = setTimeout(() => setFanned(true), 450);
    return () => clearTimeout(t);
  }, []);

  // A drag ends with a pointer-up that also reads as a tap; this tells them apart.
  const didDrag = useRef(false);

  const settle = () => animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 32 });
  const showCard = (index: number) => {
    setFront(index);
    settle();
  };
  const stepCard = (direction: 1 | -1) => {
    setFront((f) => stepDeck(f, direction, HERO_DECK.length));
    settle();
  };
  const handleDeckTap = () => {
    if (!didDrag.current) stepCard(1);
  };

  // Swiping left brings the next card forward; right brings the previous back.
  const handleDeckDragEnd = (_: unknown, info: PanInfo) => {
    const committed = Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 300;
    if (committed) stepCard(info.offset.x < 0 ? 1 : -1);
    else settle();
  };

  const handleDeckKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepCard(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepCard(-1);
    }
  };

  const frontCard = HERO_DECK[front];

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
        <section className="lp-hero-section">
          <div className="lp-hero">
            <div className="lp-hero-copy">
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

            {/* The product itself: one card per verdict, swipeable */}
            <div className="lp-hero-deck">
              <div
                className={`lp-hero-visual${fanned ? ' is-fanned' : ''}`}
                role="group"
                aria-roledescription="carousel"
                aria-label="Example Persistwork cards. Swipe, tap, or use the arrow keys to see the next."
                tabIndex={0}
                onKeyDown={handleDeckKey}
              >
                {HERO_DECK.map((c, i) => {
                  const slot = deckSlot(i, front, HERO_DECK.length);
                  const isFront = slot === 'front';
                  const counting = i === HERO_FRONT_INDEX;
                  return (
                    <div
                      key={c.verdict}
                      className={`lp-hero-card is-${slot}`}
                      aria-hidden={!isFront}
                      onClick={isFront || slot === 'hidden' ? undefined : () => showCard(i)}
                    >
                      <motion.div
                        className="lp-hero-card-inner"
                        style={isFront ? { x: dragX, rotate: dragRotate } : undefined}
                        drag={isFront ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7}
                        onPointerDown={() => {
                          didDrag.current = false;
                        }}
                        onDragStart={() => {
                          didDrag.current = true;
                        }}
                        onDragEnd={isFront ? handleDeckDragEnd : undefined}
                        onTap={isFront ? handleDeckTap : undefined}
                      >
                        <CardContent
                          quote={c.quote}
                          source={c.source}
                          subtitle={c.subtitle}
                          readiness={counting ? heroReadiness : c.readiness}
                          load={counting ? heroLoad : c.load}
                          balance={counting ? heroBalance : c.balance}
                          mood={c.mood}
                          verdict={c.label}
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              <p className="sr-only" aria-live="polite">
                Card {front + 1} of {HERO_DECK.length}: {frontCard.verdict}, {frontCard.label}.
                Readiness {frontCard.readiness}, Load {frontCard.load}, Balance {frontCard.balance}.{' '}
                {frontCard.quote} {frontCard.source}.
              </p>
              <div className="lp-hero-dots">
                {HERO_DECK.map((c, i) => (
                  <button
                    key={c.verdict}
                    type="button"
                    className={`lp-hero-dot${i === front ? ' is-active' : ''}`}
                    aria-label={`Show the ${c.verdict} card`}
                    aria-current={i === front ? 'true' : undefined}
                    onClick={() => showCard(i)}
                  />
                ))}
              </div>
              <p className="lp-hero-swipe">Swipe for the other days</p>
            </div>
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
                    74<span>Readiness</span>
                  </div>
                  <div className="lp-rcard-sub">
                    Readiness 74 &middot; Load 38 &middot; Balance +17
                  </div>
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
                    <span className="lp-why-tag">WHOOP</span>
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
                    { label: 'Rhythm', value: 60, width: 60 },
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
                <h3>Connect WHOOP</h3>
                <p>
                  Your training history sets your baseline &mdash; what you&apos;re built for
                  &mdash; so today&apos;s load is judged against it, not a generic rule. No WHOOP
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
              Connect your calendar, add WHOOP, and get one honest verdict on how hard to train
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
