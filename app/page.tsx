/**
 * RYVYNN Landing Page
 * Privacy-first mental wellness companion
 */

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
            <span className="text-2xl font-bold text-white">RYVYNN</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* The Flame Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full opacity-20 absolute blur-xl" />
              <div className="h-24 w-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center relative">
                <span className="text-4xl">🔥</span>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Your Privacy-First
            <br />
            Mental Wellness Companion
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Meet The Flame. A straightforward, supportive guide for when things feel hard.
            Your journal stays encrypted. Your data stays private. Always.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              Start Free Today
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white/10 text-white text-lg font-semibold rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Privacy-First</h3>
            <p className="text-gray-400">
              Your journal entries are encrypted on your device before being saved.
              Not even we can read them.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">The Flame</h3>
            <p className="text-gray-400">
              Clear, simple guidance when you need it. No jargon, no clinical speak.
              Just straightforward support.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Crisis-Aware</h3>
            <p className="text-gray-400">
              If you express thoughts of self-harm, we'll show you clear resources
              and emergency contacts immediately.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-32 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Simple, Honest Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-white mb-6">
                $0<span className="text-lg text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-500">✓</span>
                  5 Flame conversations per day
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-500">✓</span>
                  Basic journaling
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-500">✓</span>
                  Crisis support
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-white">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white mb-6">
                $9.99<span className="text-lg text-white/80">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white">
                  <span className="text-white">✓</span>
                  100 Flame conversations per day
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-white">✓</span>
                  Unlimited journaling
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-white">✓</span>
                  Crisis support
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-white">✓</span>
                  Export your journal
                </li>
                <li className="flex items-start gap-2 text-white">
                  <span className="text-white">✓</span>
                  Priority support
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 text-center bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Premium
              </Link>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8">
            Join RYVYNN today. Your data stays yours. Always.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-32 border-t border-white/10">
        <div className="text-center text-gray-400">
          <p className="mb-2">
            <strong>Important:</strong> RYVYNN is not a substitute for professional
            mental health care.
          </p>
          <p className="text-sm">
            If you are in crisis, call 988 (US) or your local emergency number.
          </p>
          <p className="mt-8 text-xs">© 2026 RYVYNN. Privacy-first mental wellness.</p>
        </div>
      </footer>
    </div>
  )
}
