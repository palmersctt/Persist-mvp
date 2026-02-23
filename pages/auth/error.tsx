import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function AuthError() {
  const router = useRouter()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (router.query.error) {
      setError(router.query.error as string)
    }
  }, [router.query.error])

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please check that environment variables are set correctly.'
      case 'AccessDenied':
        return 'Access denied. You cancelled the authentication or denied permissions.'
      case 'Verification':
        return 'The verification token has expired or is invalid.'
      default:
        return `Authentication error: ${error}`
    }
  }

  const handleRetry = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="#ffffff"/><path d="M38 30 L62 50 L38 70" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            <span className="text-2xl font-semibold text-white" style={{ letterSpacing: '1.5px' }}>PERSIST</span>
          </div>
          <p className="text-gray-500 text-sm">Something went wrong</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">Couldn&apos;t sign you in</h2>
            <p className="text-gray-400 text-sm mb-6">
              {getErrorMessage(error)}
            </p>
          </div>

          {error === 'Configuration' && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-200 text-xs">
                <strong>For developers:</strong> Check that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL are properly configured in your environment variables.
              </p>
            </div>
          )}

          <button
            onClick={handleRetry}
            className="w-full bg-white text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}