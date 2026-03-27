/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
    ],
  },
  async rewrites() {
    // In Docker, proxy /api/query/* to FastAPI backend
    const apiUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/query/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
