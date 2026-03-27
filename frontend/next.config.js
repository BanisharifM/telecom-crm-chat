/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  webpack: (config) => {
    // Alias plotly.js to the smaller basic dist
    config.resolve.alias = {
      ...config.resolve.alias,
      'plotly.js/dist/plotly': 'plotly.js-basic-dist-min',
      'plotly.js': 'plotly.js-basic-dist-min',
    }
    return config
  },
  async rewrites() {
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
