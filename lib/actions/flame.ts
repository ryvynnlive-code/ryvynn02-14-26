'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateFlameResponse, detectCrisisLevel, getCrisisSafetyMessage } from '@/lib/flame/engine'
import { redirect } from 'next/navigation'

export async function callFlame(userMessage: string) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

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

    // Check usage limits
    const { data: usage } = await adminClient
      .from('usage_daily')
      .select('flame_calls')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    const limit = profile?.plan === 'premium' ? 100 : 5
    const currentUsage = usage?.flame_calls || 0

    if (currentUsage >= limit) {
      return {
        success: false,
        error: 'Daily limit reached',
        limit,
        usage: currentUsage,
      }
    }

    // Generate response
    const response = generateFlameResponse({
      userMessage,
      userId: user.id,
    })

    // Increment usage
    await adminClient.rpc('increment_flame_usage', { p_user_id: user.id })

    // Log event
    await adminClient.from('events').insert({
      user_id: user.id,
      event_type: 'flame_call',
      metadata: {},
    })

    // If crisis detected, log it (without content)
    if (response.isCrisis) {
      await adminClient.from('events').insert({
        user_id: user.id,
        event_type: 'crisis_shown',
        metadata: {
          level: response.crisisLevel,
        },
      })
    }

    return {
      success: true,
      response,
      usage: currentUsage + 1,
      limit,
    }
  } catch (error) {
    console.error('Error calling Flame:', error)
    return {
      success: false,
      error: 'An error occurred',
    }
  }
}

export async function getFlameUsage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: usage } = await supabase
      .from('usage_daily')
      .select('flame_calls')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    const limit = profile?.plan === 'premium' ? 100 : 5
    const currentUsage = usage?.flame_calls || 0

    return {
      usage: currentUsage,
      limit,
      plan: profile?.plan || 'free',
    }
  } catch (error) {
    console.error('Error getting usage:', error)
    return null
  }
}
