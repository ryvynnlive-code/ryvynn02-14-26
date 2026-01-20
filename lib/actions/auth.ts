/**
 * Authentication Server Actions
 * Server-side operations for user authentication
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Log app_open event for new user
    if (data.user) {
      await supabase.from('events').insert({
        user_id: data.user.id,
        event_type: 'app_open',
        metadata: {},
      })
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error signing up:', error)
    return {
      success: false,
      error: 'An error occurred during sign up',
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Log app_open event
    if (data.user) {
      await supabase.from('events').insert({
        user_id: data.user.id,
        event_type: 'app_open',
        metadata: {},
      })
    }

    revalidatePath('/', 'layout')
    redirect('/app')
  } catch (error) {
    console.error('Error signing in:', error)
    return {
      success: false,
      error: 'An error occurred during sign in',
    }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return {
      ...user,
      profile,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Delete user account
 */
export async function deleteAccount() {
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

    // Delete user (cascade will handle related data)
    const { error } = await supabase.auth.admin.deleteUser(user.id)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    redirect('/login')
  } catch (error) {
    console.error('Error deleting account:', error)
    return {
      success: false,
      error: 'An error occurred while deleting account',
    }
  }
}
