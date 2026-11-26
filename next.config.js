/** @type {import('next').NextConfig} */
const nextConfig = {
  // The old demo lives on as Get your verdict.
  async redirects() {
    return [
      { source: '/sandbox', destination: '/verdict', permanent: true },
      { source: '/sandbox/:path*', destination: '/verdict', permanent: true },
    ]
  },
  // Nothing here is meant to be embedded. Denying frames stops clickjacking,
  // which matters most on the OAuth consent page (/oauth/authorize).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
    ]
  },
  // OAuth discovery for MCP connectors (RFC 8414 / RFC 9728).
  async rewrites() {
    return [
      { source: '/.well-known/oauth-authorization-server', destination: '/api/oauth/metadata' },
      {
        source: '/.well-known/oauth-authorization-server/:path*',
        destination: '/api/oauth/metadata',
      },
      { source: '/.well-known/oauth-protected-resource', destination: '/api/oauth/protected-resource' },
      {
        source: '/.well-known/oauth-protected-resource/:path*',
        destination: '/api/oauth/protected-resource',
      },
    ]
  },
}

module.exports = nextConfig
