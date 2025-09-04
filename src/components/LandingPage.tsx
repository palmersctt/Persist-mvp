'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleExperienceDemo = () => {
    // Trigger Google sign-in
    signIn('google')
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="font-bold text-2xl text-gray-900 tracking-tight">
              PERSIST
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('intelligence')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Intelligence
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={handleExperienceDemo}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Demo
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-7xl font-thin text-gray-900 mb-8 leading-tight">
            Work Health Intelligence Platform
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your work patterns into actionable insights for sustainable peak performance
          </p>
          <button
            onClick={handleExperienceDemo}
            className="inline-flex items-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 text-lg"
          >
            Experience Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-thin text-gray-900 mb-6">
              Three Core Intelligence Metrics
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-3xl mx-auto">
              Advanced analytics that measure what matters for sustainable performance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1 - Adaptive Performance Index */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  Adaptive Performance Index
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Comprehensive score measuring your current cognitive capacity and schedule sustainability
                </p>
              </div>
            </div>

            {/* Card 2 - Cognitive Resilience */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  Cognitive Resilience
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Your mental capacity to handle complex decisions and cognitive demands without degradation
                </p>
              </div>
            </div>

            {/* Card 3 - Sustainability Index */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  Sustainability Index
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  How maintainable your current work patterns are over the long term
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Section */}
      <section id="intelligence" className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-thin text-gray-900 mb-8">
            Intelligent Work Analysis
          </h2>
          <p className="text-xl text-gray-600 font-light mb-12 leading-relaxed">
            Our platform analyzes your calendar patterns, meeting density, and cognitive load to provide personalized insights that help you maintain peak performance while preventing burnout.
          </p>
          <button
            onClick={handleExperienceDemo}
            className="inline-flex items-center px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300"
          >
            Start Analysis
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-thin text-gray-900 mb-8">
            Simple Pricing
          </h2>
          <p className="text-xl text-gray-600 font-light mb-12 leading-relaxed">
            Start with our free analysis and upgrade when you're ready for advanced insights.
          </p>
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
            <h3 className="text-2xl font-light text-gray-900 mb-4">Free Analysis</h3>
            <p className="text-gray-600 mb-8">Get started with basic work health insights</p>
            <button
              onClick={handleExperienceDemo}
              className="w-full px-8 py-4 border-2 border-gray-900 text-gray-900 font-medium rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="font-bold text-xl text-gray-900 mb-4">PERSIST</div>
            <p className="text-gray-600 text-sm">
              Work Health Intelligence Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}