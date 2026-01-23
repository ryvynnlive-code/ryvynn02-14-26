/**
 * RYVYNN OMEGA - Truth Feed First
 * The app opens directly to the Truth Feed
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TruthFeed } from '@/components/truth-feed'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
              <span className="text-2xl font-bold text-white">RYVYNN</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/truth/post"
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    Share Your Truth
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content - Truth Feed */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Truth Feed Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-3">Truth Feed</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real people. Real feelings. Anonymous truths from the RYVYNN community.
              {!user && ' Sign up to share your truth and earn Soul Tokens.'}
            </p>
          </div>

          {/* The Truth Feed Component */}
          <TruthFeed isAuthenticated={!!user} />
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
          <p className="mt-8 text-xs">© 2026 RYVYNN. Honesty turns into stability.</p>
        </div>
      </footer>
    </div>
  )
}
