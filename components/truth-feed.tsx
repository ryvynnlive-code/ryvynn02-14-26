'use client'

import { useEffect, useState } from 'react'
import { getTruthFeed, readTruthPost } from '@/lib/actions/truth'
import { TruthPostCard } from './truth-post-card'
import { Button } from './ui/button'
import Link from 'next/link'

interface TruthPost {
  id: string
  content: string
  emotion_tag: 'light' | 'shadow'
  created_at: string
  is_visible: boolean
  contains_crisis_keywords: boolean
  crisis_level: string | null
}

interface TruthFeedProps {
  isAuthenticated?: boolean
}

export function TruthFeed({ isAuthenticated = false }: TruthFeedProps) {
  const [posts, setPosts] = useState<TruthPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readsRemaining, setReadsRemaining] = useState<number>(-1)
  const [limitInfo, setLimitInfo] = useState<{
    reads_today: number
    limit: number
    tier_name: string
  } | null>(null)

  useEffect(() => {
    loadFeed()
  }, [])

  async function loadFeed() {
    setLoading(true)
    setError(null)

    const result = await getTruthFeed(20)

    if (result.success && result.posts) {
      setPosts(result.posts)
      setReadsRemaining(result.reads_remaining || -1)
      setLimitInfo(result.limit_info || null)
    } else {
      setError(result.error || 'Failed to load Truth Feed')
    }

    setLoading(false)
  }

  async function handleReadPost(postId: string) {
    const result = await readTruthPost(postId)

    if (result.upgrade_required) {
      // Show upgrade prompt
      alert(
        `You've reached your daily read limit (${result.limit_info?.limit} reads). Upgrade to ${result.limit_info?.tier_name === 'Free' ? 'Spark' : 'a higher tier'} for unlimited reading.`
      )
    } else if (result.success) {
      // Update reads remaining
      if (result.limit_info) {
        setLimitInfo(result.limit_info)
        setReadsRemaining(
          result.limit_info.limit === -1
            ? -1
            : result.limit_info.limit - result.limit_info.reads_today
        )
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={loadFeed} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with limit info */}
      {isAuthenticated && limitInfo && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Truth Feed Reads Today: {limitInfo.reads_today}
                {limitInfo.limit !== -1 && ` / ${limitInfo.limit}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Current Tier: {limitInfo.tier_name}
              </p>
            </div>
            {limitInfo.tier_name === 'Free' && (
              <Link
                href="/settings/billing"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade for Unlimited
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">
            The Truth Feed is empty. Be the first to share your truth.
          </p>
          {isAuthenticated ? (
            <Link href="/truth/post">
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                Share Your Truth
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                Sign Up to Post
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <TruthPostCard
              key={post.id}
              post={post}
              onRead={handleReadPost}
              canRead={readsRemaining === -1 || readsRemaining > 0}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {posts.length > 0 && (
        <div className="text-center">
          <Button onClick={loadFeed} variant="outline" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Feed'}
          </Button>
        </div>
      )}
    </div>
  )
}
