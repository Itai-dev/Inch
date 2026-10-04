import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  // Old combined-site URLs → the separate INCH” / DOT. sites.
  async redirects() {
    return [
      { source: '/women', destination: '/', permanent: true },
      { source: '/women/:category', destination: '/models/:category', permanent: true },
      { source: '/men', destination: '/dot', permanent: true },
      { source: '/men/:category', destination: '/dot/models/:category', permanent: true },
    ]
  },
}

export default nextConfig
