/**
 * Wearable Device Integration (Tier 3+)
 * Supports: Apple Health, Fitbit, Garmin
 */

import { createClient } from '@/lib/supabase/server'

export interface HealthMetrics {
  heart_rate?: number
  heart_rate_variability?: number
  steps?: number
  sleep_hours?: number
  active_minutes?: number
  timestamp: Date
}

export interface WearableConnection {
  id: string
  user_id: string
  provider: 'apple_health' | 'fitbit' | 'garmin'
  access_token: string
  refresh_token?: string
  token_expires_at: string
  enabled: boolean
  config: Record<string, any>
}

/**
 * Fetch latest health metrics from wearable
 */
export async function fetchHealthMetrics(userId: string): Promise<HealthMetrics | null> {
  const connection = await getWearableConnection(userId)

  if (!connection) {
    return null
  }

  // Refresh token if expired
  if (new Date() > new Date(connection.token_expires_at)) {
    await refreshWearableToken(connection)
  }

  switch (connection.provider) {
    case 'apple_health':
      return await fetchAppleHealth(connection)
    case 'fitbit':
      return await fetchFitbit(connection)
    case 'garmin':
      return await fetchGarmin(connection)
    default:
      return null
  }
}

/**
 * Apple Health Data Fetch
 */
async function fetchAppleHealth(connection: WearableConnection): Promise<HealthMetrics | null> {
  // Apple Health requires iOS app with HealthKit permissions
  // Web API access is limited - typically done via CloudKit or HealthKit on device

  // For web-based implementation, you'd need:
  // 1. iOS app that syncs HealthKit data to your backend
  // 2. Or use Apple's CloudKit API

  return {
    timestamp: new Date(),
    // Data would come from your iOS app's sync endpoint
  }
}

/**
 * Fitbit Data Fetch
 */
async function fetchFitbit(connection: WearableConnection): Promise<HealthMetrics | null> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Fetch heart rate
    const heartRateResponse = await fetch(
      `https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },
      }
    )

    // Fetch steps
    const stepsResponse = await fetch(
      `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },
      }
    )

    if (!heartRateResponse.ok || !stepsResponse.ok) {
      throw new Error('Fitbit API error')
    }

    const heartRateData = await heartRateResponse.json()
    const stepsData = await stepsResponse.json()

    const latestHeartRate =
      heartRateData['activities-heart']?.[0]?.value?.restingHeartRate || undefined

    return {
      heart_rate: latestHeartRate,
      steps: stepsData.summary?.steps || 0,
      active_minutes: stepsData.summary?.veryActiveMinutes || 0,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error fetching Fitbit data:', error)
    return null
  }
}

/**
 * Garmin Data Fetch
 */
async function fetchGarmin(connection: WearableConnection): Promise<HealthMetrics | null> {
  // Garmin Connect API
  // See: https://developer.garmin.com/gc-developer-program/overview/

  try {
    // Garmin uses OAuth 1.0a with consumer key/secret
    // Implementation requires OAuth signature generation

    // Example endpoint (simplified):
    const response = await fetch('https://apis.garmin.com/wellness-api/rest/dailies', {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Garmin API error')
    }

    const data = await response.json()

    return {
      heart_rate: data.restingHeartRateInBeatsPerMinute,
      steps: data.totalSteps,
      active_minutes: data.activeTimeInSeconds / 60,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error fetching Garmin data:', error)
    return null
  }
}

/**
 * Analyze health metrics for wellness insights
 */
export function analyzeHealthMetrics(metrics: HealthMetrics): {
  stress_indicator: 'low' | 'medium' | 'high'
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active'
  insights: string[]
} {
  const insights: string[] = []
  let stressIndicator: 'low' | 'medium' | 'high' = 'medium'
  let activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' = 'light'

  // Heart Rate Variability Analysis
  if (metrics.heart_rate_variability !== undefined) {
    if (metrics.heart_rate_variability < 30) {
      stressIndicator = 'high'
      insights.push('Your HRV is lower than usual. Consider taking a break or doing breathing exercises.')
    } else if (metrics.heart_rate_variability > 60) {
      stressIndicator = 'low'
    }
  }

  // Activity Level Analysis
  if (metrics.steps !== undefined) {
    if (metrics.steps < 3000) {
      activityLevel = 'sedentary'
      insights.push('You've been less active today. A short walk could help boost your mood.')
    } else if (metrics.steps > 10000) {
      activityLevel = 'active'
      insights.push('Great activity level today!')
    } else if (metrics.steps > 5000) {
      activityLevel = 'moderate'
    }
  }

  // Sleep Analysis
  if (metrics.sleep_hours !== undefined) {
    if (metrics.sleep_hours < 6) {
      insights.push('You might be running on low sleep. Prioritize rest tonight.')
    }
  }

  return {
    stress_indicator: stressIndicator,
    activity_level: activityLevel,
    insights,
  }
}

/**
 * Get user's wearable connection
 */
async function getWearableConnection(userId: string): Promise<WearableConnection | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('user_id', userId)
    .in('provider', ['apple_health', 'fitbit', 'garmin'])
    .eq('enabled', true)
    .single()

  return data as WearableConnection | null
}

/**
 * Refresh wearable OAuth token
 */
async function refreshWearableToken(connection: WearableConnection): Promise<void> {
  const supabase = await createClient()

  if (connection.provider === 'fitbit') {
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token!,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Fitbit token')
    }

    const data = await response.json()

    await supabase
      .from('integration_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('id', connection.id)
  }

  // Similar implementation for Garmin if needed
}
