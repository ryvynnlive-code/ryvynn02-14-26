/**
 * Settings Page
 * User account management and subscription settings
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, deleteAccount } from '@/lib/actions/auth'
import { createCheckoutSession, createPortalSession, getSubscriptionStatus } from '@/lib/stripe/actions'

export default function SettingsPage() {
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    setIsLoading(true)
    const status = await getSubscriptionStatus()
    if (status) {
      setPlan(status.plan)
    }
    setIsLoading(false)
  }

  const handleUpgrade = () => {
    startTransition(async () => {
      await createCheckoutSession()
    })
  }

  const handleManageSubscription = () => {
    startTransition(async () => {
      await createPortalSession()
    })
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  const handleDeleteAccount = () => {
    startTransition(async () => {
      await deleteAccount()
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/app" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
                <span className="text-xl font-bold text-white">RYVYNN</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Back to App
              </Link>
              
              <button
                onClick={handleSignOut}
                disabled={isPending}
                className="text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Subscription</h2>
            
            {isLoading ? (
              <div className="text-gray-400">Loading subscription details...</div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-white">Current Plan:</span>
                    <span className={'px-3 py-1 rounded-lg text-sm font-semibold ' + (
                      plan === 'premium'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                        : 'bg-white/10 text-gray-300'
                    )}>
                      {plan === 'premium' ? 'Premium' : 'Free'}
                    </span>
                  </div>
                  
                  {plan === 'free' ? (
                    <p className="text-gray-400">
                      5 Flame calls per day. Upgrade to Premium for unlimited conversations.
                    </p>
                  ) : (
                    <p className="text-gray-400">
                      Unlimited Flame calls. Thank you for supporting RYVYNN!
                    </p>
                  )}
                </div>

                {plan === 'free' ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Upgrade to Premium</h3>
                    <p className="text-gray-400 mb-4">
                      Get unlimited access to The Flame for just $9.99/month
                    </p>
                    <ul className="space-y-2 mb-6 text-gray-300">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Unlimited Flame conversations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>All future features included</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Support privacy-first mental health</span>
                      </li>
                    </ul>
                    <button
                      onClick={handleUpgrade}
                      disabled={isPending}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Processing...' : 'Upgrade to Premium'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    disabled={isPending}
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Manage Subscription
                  </button>
                )}
              </>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Privacy & Security</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong className="text-white">End-to-end encryption:</strong> Your journal entries are encrypted on your device before being saved. Not even we can read them.
              </p>
              <p>
                <strong className="text-white">No tracking:</strong> We do not track your activity or share your data with third parties.
              </p>
              <p>
                <strong className="text-white">Secure storage:</strong> All data is stored securely with industry-standard encryption.
              </p>
            </div>
          </div>

          <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>
            
            {!showDeleteConfirm ? (
              <div>
                <p className="text-gray-300 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div>
                <p className="text-red-400 font-semibold mb-4">
                  Are you absolutely sure? This will permanently delete your account, all journal entries, and cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isPending}
                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isPending}
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
