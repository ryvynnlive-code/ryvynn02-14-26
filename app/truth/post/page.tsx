import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TruthPostForm } from '@/components/truth-post-form'

export default async function TruthPostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/truth/post')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Share Your Truth</h1>
            <p className="text-gray-400">
              Your post will be anonymous. Choose whether it's a light or shadow moment.
            </p>
          </div>

          {/* Form */}
          <TruthPostForm />

          {/* Guidelines */}
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              Truth Feed Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Be honest. This is a space for real feelings.</li>
              <li>• Choose Light (☀️) for hopeful, positive moments</li>
              <li>• Choose Shadow (🌙) for struggles, pain, or darkness</li>
              <li>
                • Your post is anonymous - no one knows it's you
              </li>
              <li>• Posts with crisis keywords are held for review</li>
              <li>• Earn Soul Tokens for every truth you share</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
