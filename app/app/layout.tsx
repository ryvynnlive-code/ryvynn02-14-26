/**
 * App Layout - Navigation and structure for authenticated pages
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/app" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
                <span className="text-xl font-bold text-white">RYVYNN</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/app"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  The Flame
                </Link>
                <Link
                  href="/app/journal"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Journal
                </Link>
                <Link
                  href="/app/settings"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-gray-400">{profile?.email}</span>
                {profile?.plan === 'premium' && (
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-semibold">
                    Premium
                  </span>
                )}
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <Link
              href="/app"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              The Flame
            </Link>
            <Link
              href="/app/journal"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Journal
            </Link>
            <Link
              href="/app/settings"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
