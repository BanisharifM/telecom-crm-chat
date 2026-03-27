'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  MessageSquare, BarChart3, Shield, Zap, ArrowRight, ChevronRight,
  Menu, X, Users, TrendingDown, Phone, Globe,
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Insights', href: '#features' },
  { label: 'Solutions', href: '#how-it-works' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* ═══ Navbar ═══ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon-light.png" alt="" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">
              Telecom<span className="text-[#0AA4B0]">Co</span>
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.12em] text-gray-500 ml-1">
              National Provider
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#0AA4B0] hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm bg-[#0AA4B0] text-white font-medium px-5 py-2 rounded-lg hover:bg-[#089da6] transition-colors"
              >
                {session.user.image && (
                  <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" />
                )}
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="text-sm bg-[#0AA4B0] text-white font-medium px-5 py-2 rounded-lg hover:bg-[#089da6] transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#030712] border-t border-white/5 px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10 mt-2 space-y-2">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="block text-center text-sm bg-[#0AA4B0] text-white font-medium py-3 rounded-lg hover:bg-[#089da6] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-center text-sm text-gray-300 hover:text-white py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/login"
                    className="block text-center text-sm bg-[#0AA4B0] text-white font-medium py-3 rounded-lg hover:bg-[#089da6] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(10,164,176,0.1),transparent_55%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm bg-[#0AA4B0]/10 text-[#0AA4B0] border border-[#0AA4B0]/20 mb-6 sm:mb-8">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered CRM Insights for Telecom
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Ask Your Customer Data{' '}
            <span className="bg-gradient-to-r from-[#0AA4B0] to-[#0A3963] bg-clip-text text-transparent">
              Anything
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Built for telecom marketers who need answers, not SQL.
            Ask about churn, billing, service calls, and customer behavior in plain English.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0AA4B0] text-white font-semibold px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg hover:bg-[#089da6] transition-all shadow-[0_0_40px_-10px_rgba(10,164,176,0.4)]"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-400 font-medium px-6 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              See How It Works
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>

          {/* Product mockup */}
          <div className="mt-12 sm:mt-16 relative mx-auto max-w-3xl">
            <div className="absolute -inset-4 bg-gradient-to-b from-[#0AA4B0]/8 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 sm:p-2 shadow-2xl">
              <div className="rounded-xl bg-[#0a0e17] p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4 max-w-xl mx-auto">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-[#0AA4B0]/10 border border-[#0AA4B0]/20 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm">
                      What is the churn rate by state?
                    </div>
                  </div>
                  {/* Bot response */}
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-300 max-w-sm sm:max-w-md">
                      <p className="mb-2">Churn varies significantly across states. <strong className="text-white">NJ and CA lead at 26.5%</strong> churn rate, well above the 14.5% average.</p>
                      <div className="flex gap-2 sm:gap-3 mt-3">
                        <div className="bg-[#0AA4B0]/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center flex-1">
                          <div className="text-sm sm:text-lg font-bold text-[#0AA4B0]">14.5%</div>
                          <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase">Avg Churn</div>
                        </div>
                        <div className="bg-red-500/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center flex-1">
                          <div className="text-sm sm:text-lg font-bold text-red-400">483</div>
                          <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase">Churned</div>
                        </div>
                        <div className="bg-white/5 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center flex-1">
                          <div className="text-sm sm:text-lg font-bold">3,333</div>
                          <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase">Customers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="border-y border-white/10 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: '3,333', label: 'Customers Tracked', icon: Users },
              { value: '51', label: 'States Covered', icon: Globe },
              { value: '<1s', label: 'Query Response', icon: Zap },
              { value: '14.5%', label: 'Churn Rate Detected', icon: TrendingDown },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center">
                <stat.icon className="h-5 w-5 text-[#0AA4B0] mb-2" />
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Three simple steps from question to insight. Built for marketers, powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {[
              {
                step: '01', icon: MessageSquare, title: 'Ask a Question',
                desc: 'Type any question in plain English. "Show me churn by state" or "Which customers spend the most?" No SQL knowledge needed.',
              },
              {
                step: '02', icon: Zap, title: 'AI Analyzes Your Data',
                desc: 'Claude AI converts your question into an optimized query, validates it for safety, and runs it against your CRM database in milliseconds.',
              },
              {
                step: '03', icon: BarChart3, title: 'Get Charts & Answers',
                desc: 'Receive interactive charts, data tables, and AI-written explanations. Download results as CSV or share with your team.',
              },
            ].map(item => (
              <div key={item.step} className="relative group text-center md:text-left">
                <div className="text-5xl sm:text-6xl font-bold text-white/5 mb-3">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-[#0AA4B0]/10 flex items-center justify-center text-[#0AA4B0] mb-4 mx-auto md:mx-0 group-hover:bg-[#0AA4B0]/20 transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="py-20 sm:py-32 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Built for Telecom Marketing Teams</h2>
            <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Understand your subscribers, predict churn, and make data-driven decisions -- all through conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: MessageSquare, title: 'Natural Language Queries',
                desc: 'Ask questions like "Compare international plan holders vs non-holders" and get instant, accurate answers with interactive charts.',
              },
              {
                icon: BarChart3, title: 'CRM Dashboards',
                desc: 'Pre-built dashboards showing churn rate, revenue breakdown, customer segmentation, and service quality metrics at a glance.',
              },
              {
                icon: Shield, title: 'Churn Prediction',
                desc: 'AI identifies at-risk subscribers based on service calls, usage patterns, and plan features. Take action before customers leave.',
              },
              {
                icon: Phone, title: 'Service Call Analytics',
                desc: 'Track customer service patterns across 3,333 subscribers. Customers with 4+ calls churn at 3x the average rate.',
              },
              {
                icon: Globe, title: 'Geographic Insights',
                desc: 'Analyze performance across 51 states. Identify regional churn hotspots and target retention campaigns geographically.',
              },
              {
                icon: Zap, title: 'Sub-Second Performance',
                desc: 'Queries execute instantly. No waiting for batch reports. Ask a question, get an answer with charts in under a second.',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className="group bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0AA4B0]/10 flex items-center justify-center text-[#0AA4B0] mb-4 group-hover:bg-[#0AA4B0]/20 transition-colors">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Sample Queries ═══ */}
      <section className="py-20 sm:py-32 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">Try These Questions</h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12">
            Real queries against real telecom CRM data. 3,333 customers, 20 data points each.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              'What is the overall churn rate?',
              'Show churn rate by state',
              'Top 10 customers by total charges',
              'Compare intl plan holders vs non-holders',
              'Distribution of customer service calls',
              'Average monthly bill in California',
            ].map(query => (
              <div
                key={query}
                className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 hover:border-[#0AA4B0]/30 hover:text-white transition-all cursor-default text-left"
              >
                <span className="text-[#0AA4B0] mr-1.5">&gt;</span>{query}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,164,176,0.08),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to understand your subscribers?
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-8 sm:mb-10">
            Start asking questions in plain English. No credit card required. No SQL skills needed.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-600">Sign in with Google to get started</p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/icon-light.png" alt="" className="h-7 w-7" />
                <span className="text-base font-bold">Telecom<span className="text-[#0AA4B0]">Co</span></span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI-powered CRM intelligence for national telecommunications providers.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Product</h4>
              <div className="space-y-2.5">
                <Link href="/chat" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Chat</Link>
                <Link href="/dashboard" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Dashboard</Link>
                <Link href="/explorer" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Data Explorer</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Resources</h4>
              <div className="space-y-2.5">
                <a href="#how-it-works" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">How It Works</a>
                <a href="#features" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Features</a>
                <a href="https://github.com/BanisharifM/telecom-crm-chat" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">GitHub</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Company</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-gray-500">TelecomCo Inc.</span>
                <span className="block text-sm text-gray-500">National Provider</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
            <span>Copyright &copy; {new Date().getFullYear()} TelecomCo Inc. All rights reserved.</span>
            <span>Built by BD</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
