module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/login',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // Performance: 70+ realistic for Plotly-heavy dashboard
        'categories:performance': ['warn', { minScore: 0.7, aggregationMethod: 'median-run' }],
        // Accessibility: 90+ strict
        'categories:accessibility': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        // Best practices: 90+
        'categories:best-practices': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        // SEO
        'categories:seo': ['warn', { minScore: 0.8, aggregationMethod: 'median-run' }],
        // Core Web Vitals
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median-run' }],
        'total-blocking-time': ['warn', { maxNumericValue: 500, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
