'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTruthPost } from '@/lib/actions/truth'
import { Button } from './ui/button'

export function TruthPostForm() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [emotionTag, setEmotionTag] = useState<'light' | 'shadow'>('light')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const charCount = content.length
  const isValid = charCount >= 10 && charCount <= 2000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid) {
      setError('Truth post must be between 10 and 2000 characters')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createTruthPost(content, emotionTag)

    if (result.success) {
      if (result.contains_crisis) {
        alert(
          'Your post contains crisis-related content and has been held for review. Please reach out for help if you need it. Crisis resources: Call 988 (US) or visit your local emergency room.'
        )
      } else {
        alert('Your truth has been shared anonymously. Soul Tokens earned!')
      }
      router.push('/')
    } else {
      setError(result.error || 'Failed to create post')

      if (result.upgrade_required && result.limit_info) {
        setError(
          `Daily posting limit reached (${result.limit_info.used}/${result.limit_info.limit}). Upgrade to ${result.limit_info.tier_name === 'Free' ? 'Spark' : 'a higher tier'} for more posts.`
        )
      }
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Emotion Tag Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What kind of moment is this?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setEmotionTag('light')}
            className={`p-4 rounded-lg border-2 transition-all ${
              emotionTag === 'light'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-2">☀️</div>
            <div className="font-semibold text-white">Light</div>
            <div className="text-xs text-gray-400 mt-1">
              Hope, joy, gratitude, progress
            </div>
          </button>

          <button
            type="button"
            onClick={() => setEmotionTag('shadow')}
            className={`p-4 rounded-lg border-2 transition-all ${
              emotionTag === 'shadow'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-2">🌙</div>
            <div className="font-semibold text-white">Shadow</div>
            <div className="text-xs text-gray-400 mt-1">
              Struggle, pain, fear, darkness
            </div>
          </button>
        </div>
      </div>

      {/* Content Textarea */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
          Your Truth
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share what's real for you right now..."
          className="w-full h-48 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-sm ${
              charCount < 10
                ? 'text-gray-500'
                : charCount > 2000
                  ? 'text-red-400'
                  : 'text-green-400'
            }`}
          >
            {charCount} / 2000 characters
            {charCount < 10 && ` (minimum: 10)`}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/')}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sharing...' : 'Share Anonymously'}
        </Button>
      </div>
    </form>
  )
}
