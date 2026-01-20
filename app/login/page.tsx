/**
 * Login Page
 * User authentication with email/password
 */

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    startTransition(async () => {
      const result = await signIn(email, password)
      if (result && !result.success) {
        setError(result.error || 'Failed to sign in')
      }
      // Success will redirect to /app
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
            <span className="text-3xl font-bold text-white">RYVYNN</span>
          </div>
          <p className="text-gray-400 text-center">Welcome back</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-6">Log In</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                disabled={isPending}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                disabled={isPending}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isPending ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
