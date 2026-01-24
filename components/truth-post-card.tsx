'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface TruthPost {
  id: string
  content: string
  emotion_tag: 'light' | 'shadow'
  created_at: string
  is_visible: boolean
  contains_crisis_keywords: boolean
  crisis_level: string | null
}

interface TruthPostCardProps {
  post: TruthPost
  onRead: (postId: string) => Promise<void>
  canRead: boolean
  isAuthenticated: boolean
}

export function TruthPostCard({
  post,
  onRead,
  canRead,
  isAuthenticated,
}: TruthPostCardProps) {
  const [isReading, setIsReading] = useState(false)
  const [hasRead, setHasRead] = useState(false)

  async function handleRead() {
    if (!isAuthenticated) return
    if (hasRead) return

    setIsReading(true)
    await onRead(post.id)
    setHasRead(true)
    setIsReading(false)
  }

  const emotionColor =
    post.emotion_tag === 'light'
      ? 'from-amber-500 to-yellow-500'
      : 'from-indigo-500 to-purple-500'

  const emotionLabel = post.emotion_tag === 'light' ? '☀️ Light' : '🌙 Shadow'

  return (
    <div
      className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={handleRead}
    >
      {/* Emotion Tag */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${emotionColor} text-white`}
        >
          {emotionLabel}
        </span>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Content */}
      <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Read indicator for authenticated users */}
      {isAuthenticated && !hasRead && (
        <div className="mt-4 text-xs text-gray-500">
          {canRead ? (
            <span>Click to mark as read and earn Soul Tokens</span>
          ) : (
            <span className="text-orange-400">
              Daily read limit reached. Upgrade to continue reading.
            </span>
          )}
        </div>
      )}

      {isAuthenticated && hasRead && (
        <div className="mt-4 text-xs text-green-400">✓ Read • Soul Tokens earned</div>
      )}

      {isReading && (
        <div className="mt-4">
          <div className="animate-pulse h-2 w-full bg-slate-700 rounded" />
        </div>
      )}
    </div>
  )
}
