/** @type {import('next').NextConfig} */
const nextConfig = {
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
