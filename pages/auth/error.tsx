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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FBF7F2', color: '#1C1917' }}>
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="#1C1917"/><path d="M38 30 L62 50 L38 70" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            <span className="text-2xl font-semibold" style={{ color: '#1C1917', letterSpacing: '1.5px' }}>Persistwork</span>
          </div>
          <p className="text-sm" style={{ color: '#A8A29E' }}>Something went wrong</p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: '#FEFCF9', border: '1px solid #E7E0D8' }}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#1C1917' }}>Couldn&apos;t sign you in</h2>
            <p className="text-sm mb-6" style={{ color: '#57534E' }}>
              {getErrorMessage(error)}
            </p>
          </div>

          {error === 'Configuration' && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FAEAE9', border: '1px solid rgba(192,84,74,0.2)' }}>
              <p className="text-xs" style={{ color: '#C0544A' }}>
                <strong>For developers:</strong> Check that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL are properly configured in your environment variables.
              </p>
            </div>
          )}

          <button
            onClick={handleRetry}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: '#E87D3A', color: '#ffffff' }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
