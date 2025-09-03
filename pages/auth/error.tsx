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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">PERSIST</h1>
          <p className="text-gray-400">Authentication Error</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-4 text-red-400">Authentication Failed</h2>
            <p className="text-gray-300 text-sm mb-6">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}