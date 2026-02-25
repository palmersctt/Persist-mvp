'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import PersistLogo from './PersistLogo'
import ShareCard from './ShareCard'
import { type Mood } from '../lib/mood'

export default function LandingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeCard, setActiveCard] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const cards = [
    {
      quote: "I'm kind of a big deal.",
      source: 'Anchorman — Ron Burgundy',
      subtitle: 'The kind of day where you actually get to think.',
      focus: 84, strain: 32, balance: 76,
      mood: 'flow' as Mood,
    },
    {
      quote: 'Houston, we have a problem.',
      source: 'Apollo 13 — Jim Lovell',
      subtitle: "Your calendar wrote checks your brain can't cash.",
      focus: 44, strain: 38, balance: 72,
      mood: 'coasting' as Mood,
    },
    {
      quote: "I'll be back.",
      source: 'Terminator — The Terminator',
      subtitle: "Not your best day on paper, but you've handled worse.",
      focus: 52, strain: 48, balance: 55,
      mood: 'autopilot' as Mood,
    },
  ]

  function goTo(index: number) {
    setActiveCard(Math.max(0, Math.min(cards.length - 1, index)))
  }

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleGetStarted = () => {
    // Trigger Google sign-in
    signIn('google')
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    // Close mobile menu after navigation
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-2">
              <PersistLogo size={28} variant="dark" />
              <span className="font-semibold text-xl text-gray-900" style={{ letterSpacing: '1.5px' }}>PERSIST</span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                What You Get
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Start Free
              </button>
            </div>

            {/* Desktop Login Button */}
            <button
              type="button"
              onClick={handleGetStarted}
              className="hidden md:block ml-8 px-4 py-2 border border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              Login
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20">
          <div className="px-6 py-6 space-y-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-3 text-gray-900 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              What You Get
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left px-4 py-3 text-gray-900 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left px-4 py-3 text-gray-900 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Start Free
            </button>
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleGetStarted}
                className="block w-full px-4 py-3 border border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 text-center"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-7xl font-thin text-gray-900 mb-8 leading-tight">
            Your workday has a sense of humor
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
            Persist analyzes your workday and gives you the laugh your day deserves.
          </p>

          {/* 3-Card Carousel — pure state, no scroll container */}
          <div className="max-w-xs mx-auto mb-6 px-4">
            {/* Card display */}
            <div
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return
                const diff = touchStartX.current - e.changedTouches[0].clientX
                if (Math.abs(diff) > 50) goTo(activeCard + (diff > 0 ? 1 : -1))
                touchStartX.current = null
              }}
            >
              {cards.map((card, i) => (
                <div
                  key={i}
                  style={{ display: i === activeCard ? 'block' : 'none' }}
                >
                  <ShareCard
                    quote={card.quote}
                    source={card.source}
                    subtitle={card.subtitle}
                    focus={card.focus}
                    strain={card.strain}
                    balance={card.balance}
                    mood={card.mood}
                  />
                </div>
              ))}
            </div>

            {/* Navigation: arrows + dots */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={() => goTo(activeCard - 1)}
                disabled={activeCard === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30"
                style={{ minHeight: 32, minWidth: 32 }}
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {cards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === activeCard ? '#374151' : '#d1d5db',
                    transform: i === activeCard ? 'scale(1.3)' : 'scale(1)',
                    minHeight: 10, minWidth: 10,
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => goTo(activeCard + 1)}
                disabled={activeCard === cards.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30"
                style={{ minHeight: 32, minWidth: 32 }}
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-10">
            Every day is different. So is your card.
          </p>

          <button
            type="button"
            onClick={handleGetStarted}
            className="inline-flex items-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 text-lg"
          >
            Try It Free
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-thin text-gray-900 mb-6">
              It actually knows what kind of day you&apos;re having
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
              We read your calendar and turn it into three simple scores
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1 - Focus */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  Focus
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  How close you are to hiding in a conference room with your laptop
                </p>
              </div>
            </div>

            {/* Card 2 - Strain */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  Strain
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  How close you are to faking a dentist appointment
                </p>
              </div>
            </div>

            {/* Card 3 - Balance */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  Balance
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  How long until your body sends you an out-of-office
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-thin text-gray-900 mb-16 text-center">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Connect your calendar</h3>
              <p className="text-gray-600 leading-relaxed">
                Takes 10 seconds. We only read event titles and times.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Get your daily card</h3>
              <p className="text-gray-600 leading-relaxed">
                Every morning — your scores and a laugh that nails your vibe.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Send it to someone</h3>
              <p className="text-gray-600 leading-relaxed">
                One tap. Share the laugh with someone who gets it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-thin text-gray-900 mb-8">
            Get Started Today
          </h2>
          <p className="text-xl text-gray-600 font-light mb-12 leading-relaxed">
            Connect your Google Calendar and get your first laugh in seconds.
          </p>
          <button
            type="button"
            onClick={handleGetStarted}
            className="px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 text-lg"
          >
            Try It Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PersistLogo size={22} variant="dark" />
              <span className="font-semibold text-lg text-gray-900" style={{ letterSpacing: '1.5px' }}>PERSIST</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Comic relief for your workday
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              &copy; 2026 PERSIST. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
