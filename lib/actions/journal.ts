/**
 * Journal Server Actions
 * Server-side operations for encrypted journal entries
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JournalEntry {
  id: string
  created_at: string
  updated_at: string
  ciphertext: string
  iv: string
  algo_version: string
  tags: string[]
}

/**
 * Create a new encrypted journal entry
 */
export async function createJournalEntry(
  ciphertext: string,
  iv: string,
  tags: string[] = []
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        ciphertext,
        iv,
        algo_version: 'AES-GCM-256',
        tags,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating journal entry:', error)
      return {
        success: false,
        error: 'Failed to create journal entry',
      }
    }

    // Log event
    await supabase.from('events').insert({
      user_id: user.id,
      event_type: 'journal_created',
      metadata: {},
    })

    revalidatePath('/app/journal')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return {
      success: false,
      error: 'An error occurred while creating journal entry',
    }
  }
}

/**
 * Get all journal entries for current user
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, created_at, updated_at, ciphertext, iv, algo_version, tags')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching journal entries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return []
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(entryId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting journal entry:', error)
      return {
        success: false,
        error: 'Failed to delete journal entry',
      }
    }

    revalidatePath('/app/journal')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    return {
      success: false,
      error: 'An error occurred while deleting journal entry',
    }
  }
}
