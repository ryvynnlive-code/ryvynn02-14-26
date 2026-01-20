/**
 * Admin Dashboard
 * Analytics and metrics for platform monitoring
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Metrics {
  totalUsers: number
  activeUsers: number
  flameCalls: number
  crisisDetections: number
  premiumUsers: number
  revenueEstimate: number
}

interface RecentEvent {
  id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown>
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    activeUsers: 0,
    flameCalls: 0,
    crisisDetections: 0,
    premiumUsers: 0,
    revenueEstimate: 0,
  })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  useEffect(() => {
    loadMetrics()
    loadRecentEvents()
  }, [timeRange])

  const loadMetrics = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const cutoffDate = new Date()
      if (timeRange === '24h') cutoffDate.setHours(cutoffDate.getHours() - 24)
      else if (timeRange === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7)
      else cutoffDate.setDate(cutoffDate.getDate() - 30)

      const [
        usersResult,
        activeUsersResult,
        flameCallsResult,
        crisisResult,
        premiumResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('user_id', { count: 'exact', head: true }).gte('created_at', cutoffDate.toISOString()).eq('event_type', 'app_open'),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', cutoffDate.toISOString()).eq('event_type', 'flame_call'),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', cutoffDate.toISOString()).eq('event_type', 'crisis_shown'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'premium'),
      ])

      setMetrics({
        totalUsers: usersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        flameCalls: flameCallsResult.count || 0,
        crisisDetections: crisisResult.count || 0,
        premiumUsers: premiumResult.count || 0,
        revenueEstimate: (premiumResult.count || 0) * 9.99,
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
    }

    setIsLoading(false)
  }

  const loadRecentEvents = async () => {
    const supabase = createClient()

    try {
      const { data } = await supabase
        .from('events')
        .select('id, event_type, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(20)

      setRecentEvents(data || [])
    } catch (error) {
      console.error('Error loading recent events:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return '$' + amount.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg" />
              <span className="text-xl font-bold text-white">RYVYNN Admin</span>
            </div>
            
            <Link
              href="/app"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setTimeRange('24h')}
              className={'px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (
                timeRange === '24h'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={'px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (
                timeRange === '7d'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={'px-4 py-2 rounded-md text-sm font-semibold transition-colors ' + (
                timeRange === '30d'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              30 Days
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="text-gray-400">Loading metrics...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">Active Users ({timeRange})</h3>
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-3xl font-bold text-white">{metrics.activeUsers}</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">Flame Calls ({timeRange})</h3>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-3xl font-bold text-white">{metrics.flameCalls}</p>
              </div>

              <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-red-400 text-sm font-medium">Crisis Detections ({timeRange})</h3>
                  <span className="text-2xl">🚨</span>
                </div>
                <p className="text-3xl font-bold text-red-400">{metrics.crisisDetections}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-orange-400 text-sm font-medium">Premium Users</h3>
                  <span className="text-2xl">💎</span>
                </div>
                <p className="text-3xl font-bold text-orange-400">{metrics.premiumUsers}</p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-green-400 text-sm font-medium">Monthly Revenue</h3>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(metrics.revenueEstimate)}</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              
              {recentEvents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No recent events</p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">
                          {event.event_type === 'app_open' && '👋'}
                          {event.event_type === 'flame_call' && '🔥'}
                          {event.event_type === 'crisis_shown' && '🚨'}
                          {event.event_type === 'upgrade' && '💎'}
                        </span>
                        <div>
                          <p className="text-white font-medium">
                            {event.event_type === 'app_open' && 'User opened app'}
                            {event.event_type === 'flame_call' && 'Flame conversation'}
                            {event.event_type === 'crisis_shown' && 'Crisis detected'}
                            {event.event_type === 'upgrade' && 'User upgraded to Premium'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(event.created_at)}
                          </p>
                        </div>
                      </div>
                      {event.event_type === 'crisis_shown' && event.metadata?.level ? (
                        <span className={'px-3 py-1 rounded-lg text-xs font-semibold ' + (
                          event.metadata.level === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : event.metadata.level === 'medium'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        )}>
                          {String(event.metadata.level).toUpperCase()}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
