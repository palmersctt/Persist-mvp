'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        
        setMessage('Login successful! Redirecting...')
        setTimeout(() => router.push('/'), 1000)
        
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        })
        
        if (error) throw error
        
        if (data.user && !data.session) {
          setMessage('Check your email for verification link!')
        } else {
          setMessage('Account created! Redirecting...')
          setTimeout(() => router.push('/'), 1000)
        }
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FBF7F2', color: '#1C1917' }}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wide mb-2" style={{ color: '#1C1917' }}>PERSIST<span style={{ color: '#E87D3A' }}>WORK</span></h1>
          <p className="text-sm" style={{ color: '#A8A29E' }}>Your calendar has a lot to say about you</p>
        </div>

        {/* Auth Form */}
        <div className="rounded-lg p-8" style={{ backgroundColor: '#FEFCF9', border: '1px solid #E7E0D8' }}>
          <div className="flex justify-center mb-6">
            <div className="rounded-lg p-1 flex" style={{ backgroundColor: '#E7E0D8' }}>
              <button
                onClick={() => setIsLogin(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isLogin ? 'bg-[#1C1917] text-[#FBF7F2]' : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !isLogin ? 'bg-[#1C1917] text-[#FBF7F2]' : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#57534E' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E87D3A] focus:border-transparent"
                    style={{ backgroundColor: '#FBF7F2', border: '1px solid #E7E0D8', color: '#1C1917' }}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#57534E' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E87D3A] focus:border-transparent"
                    style={{ backgroundColor: '#FBF7F2', border: '1px solid #E7E0D8', color: '#1C1917' }}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#57534E' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E87D3A] focus:border-transparent"
                style={{ backgroundColor: '#FBF7F2', border: '1px solid #E7E0D8', color: '#1C1917' }}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#57534E' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E87D3A] focus:border-transparent"
                style={{ backgroundColor: '#FBF7F2', border: '1px solid #E7E0D8', color: '#1C1917' }}
                placeholder="Enter your password"
                minLength={6}
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('error') || message.includes('Error')
                  ? 'border'
                  : 'border'
              }`} style={{
                backgroundColor: message.includes('error') || message.includes('Error') ? 'rgba(192,84,74,0.08)' : 'rgba(90,122,92,0.08)',
                color: message.includes('error') || message.includes('Error') ? '#C0544A' : '#5A7A5C',
                borderColor: message.includes('error') || message.includes('Error') ? 'rgba(192,84,74,0.2)' : 'rgba(90,122,92,0.2)'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1C1917', color: '#FBF7F2' }}
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#57534E' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="hover:underline font-medium"
                style={{ color: '#1C1917' }}
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: '#A8A29E' }}>
            Free forever. Connect your Google Calendar to get started.
          </p>
        </div>
      </div>
    </div>
  )
}