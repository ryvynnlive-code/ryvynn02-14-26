/**
 * Main App Page
 * The Flame interface - core mental wellness companion
 */

'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { callFlame, getFlameUsage } from '@/lib/actions/flame'
import { signOut } from '@/lib/actions/auth'
import { createCheckoutSession } from '@/lib/stripe/actions'

interface Message {
  id: string
  type: 'user' | 'flame'
  content: string
  isCrisis?: boolean
  crisisLevel?: 'low' | 'medium' | 'high'
  timestamp: Date
}

export default function AppPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [usage, setUsage] = useState({ current: 0, limit: 5 })
  const [showCrisisResources, setShowCrisisResources] = useState(false)
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUsage()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadUsage = async () => {
    const usageData = await getFlameUsage()
    if (usageData) {
      setUsage({ current: usageData.usage, limit: usageData.limit })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    const result = await callFlame(userMessage)

    if (result.success && result.response) {
      const flameContent = result.response.reflection + '\n\n' + result.response.nextStep + '\n\n' + result.response.copingTool
      const flameMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'flame',
        content: flameContent,
        isCrisis: result.response.isCrisis,
        crisisLevel: result.response.crisisLevel,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, flameMsg])

      if (result.response.isCrisis) {
        setShowCrisisResources(true)
      }

      if (result.usage !== undefined && result.limit !== undefined) {
        setUsage({ current: result.usage, limit: result.limit })
      }
    } else if (result.error === 'Daily limit reached') {
      const limitMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'flame',
        content: "You've reached your daily limit. Upgrade to Premium for unlimited conversations with The Flame.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, limitMsg])
    } else {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'flame',
        content: result.error || 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    }

    setIsLoading(false)
    await loadUsage()
  }

  const handleUpgrade = () => {
    startTransition(async () => {
      await createCheckoutSession()
    })
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
              <span className="text-xl font-bold text-white">RYVYNN</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {usage.current}/{usage.limit} calls today
              </div>
              
              <Link
                href="/app/settings"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Settings
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

      {showCrisisResources && (
        <div className="bg-red-500/10 border-b border-red-500/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-2">Crisis Resources</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>National Suicide Prevention Lifeline: <a href="tel:988" className="text-red-400 hover:text-red-300">988</a></p>
                  <p>Crisis Text Line: Text HOME to <a href="sms:741741" className="text-red-400 hover:text-red-300">741741</a></p>
                  <p>If you are in immediate danger, please call 911 or go to your nearest emergency room.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCrisisResources(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full opacity-20 absolute blur-xl" />
                    <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center relative">
                      <span className="text-4xl">🔥</span>
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Welcome to The Flame</h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Share what is on your mind. The Flame is here to listen and guide you through difficult moments with clear, supportive advice.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={'flex ' + (message.type === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={'max-w-[80%] rounded-2xl p-4 ' + (
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                        : message.isCrisis
                        ? 'bg-red-500/10 border border-red-500/20 text-gray-100'
                        : 'bg-white/5 border border-white/10 text-gray-100'
                    )}
                  >
                    {message.type === 'flame' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🔥</span>
                        <span className="text-sm font-semibold text-orange-400">The Flame</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.isCrisis && (
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <p className="text-xs text-red-400">
                          Crisis support resources are available above. You are not alone.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 max-w-3xl">
            {usage.current >= usage.limit && (
              <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-orange-400 font-semibold">Daily limit reached</p>
                    <p className="text-sm text-gray-400">Upgrade to Premium for unlimited conversations</p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={isPending}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share what's on your mind..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={isLoading || usage.current >= usage.limit}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || usage.current >= usage.limit}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
