/**
 * Journal Page - Encrypted journal entries
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  encrypt,
  decrypt,
  deriveKey,
  getSalt,
  initializeEncryption,
  isEncryptionInitialized,
} from '@/lib/crypto/encryption'

interface JournalEntry {
  id: string
  created_at: string
  ciphertext: string
  iv: string
  decrypted?: string
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newEntry, setNewEntry] = useState('')
  const [password, setPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)

  const supabase = createClient()

  useEffect(() => {
    initializeJournal()
  }, [])

  async function initializeJournal() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      if (!isEncryptionInitialized(user.id)) {
        setShowPasswordPrompt(true)
        setIsLoading(false)
        return
      }

      setHasPassword(true)
      setShowPasswordPrompt(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Error initializing journal:', err)
      setError('Failed to initialize journal')
      setIsLoading(false)
    }
  }

  async function unlockJournal() {
    if (!userId || !password) return

    try {
      setError('')
      let salt = getSalt(userId)
      if (!salt) {
        salt = initializeEncryption(userId)
      }

      const key = await deriveKey(password, salt)
      setEncryptionKey(key)
      setHasPassword(true)
      setShowPasswordPrompt(false)
      await loadEntries(key)
    } catch (err) {
      console.error('Error unlocking journal:', err)
      setError('Failed to unlock journal.')
    }
  }

  async function loadEntries(key: CryptoKey) {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const decryptedEntries = await Promise.all(
        (data || []).map(async (entry) => {
          try {
            const decrypted = await decrypt(entry.ciphertext, entry.iv, key)
            return { ...entry, decrypted }
          } catch {
            return { ...entry, decrypted: '[Unable to decrypt]' }
          }
        })
      )

      setEntries(decryptedEntries)
    } catch (err) {
      console.error('Error loading entries:', err)
      setError('Failed to load journal entries')
    }
  }

  async function createEntry() {
    if (!newEntry.trim() || !encryptionKey || !userId) return

    try {
      setError('')
      const { ciphertext, iv } = await encrypt(newEntry, encryptionKey)
      const { error } = await supabase.from('journal_entries').insert({
        user_id: userId,
        ciphertext,
        iv,
      })

      if (error) throw error
      await loadEntries(encryptionKey)
      setNewEntry('')

      await supabase.from('events').insert({
        user_id: userId,
        event_type: 'journal_created',
        metadata: {},
      })
    } catch (err) {
      console.error('Error creating entry:', err)
      setError('Failed to save journal entry')
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this journal entry?')) return

    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id)
      if (error) throw error
      setEntries(entries.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Error deleting entry:', err)
      setError('Failed to delete entry')
    }
  }

  async function exportJournal() {
    try {
      const exportData = entries.map((entry) => ({
        date: new Date(entry.created_at).toLocaleString(),
        content: entry.decrypted || '[Unable to decrypt]',
      }))

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ryvynn-journal-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting journal:', err)
      setError('Failed to export journal')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="text-gray-400">Loading your journal...</div>
      </div>
    )
  }

  if (showPasswordPrompt) {
    return (
      <div className="max-w-md mx-auto py-20">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {hasPassword ? 'Unlock Your Journal' : 'Create Journal Password'}
            </h2>
            <p className="text-gray-400 text-sm">
              {hasPassword
                ? 'Enter your password to decrypt your journal entries.'
                : 'Create a password to encrypt your journal entries.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              unlockJournal()
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              minLength={8}
              required
            />

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {hasPassword ? 'Unlock Journal' : 'Create & Unlock'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Your password encrypts your journal locally. We never see your password.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Journal</h1>
          <p className="text-gray-400">
            Your thoughts, privately encrypted. Only you can read them.
          </p>
        </div>

        {entries.length > 0 && (
          <button
            onClick={exportJournal}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
          >
            Export
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">New Entry</h3>
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Write your thoughts here..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 resize-none"
        />
        <button
          onClick={createEntry}
          disabled={!newEntry.trim()}
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No entries yet</h3>
          <p className="text-gray-400">Start writing your first journal entry above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-gray-400">
                  {new Date(entry.created_at).toLocaleString()}
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
              <div className="text-gray-200 whitespace-pre-wrap">{entry.decrypted}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
