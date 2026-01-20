/**
 * Calendar Integration (Tier 3+)
 * Supports: Google Calendar, Apple Calendar (via CalDAV), Outlook Calendar
 */

import { createClient } from '@/lib/supabase/server'

export interface CalendarEvent {
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  reminders?: number[] // minutes before event
}

export interface CalendarConnection {
  id: string
  user_id: string
  provider: 'google_calendar' | 'apple_calendar' | 'outlook_calendar'
  access_token: string
  refresh_token?: string
  token_expires_at: string
  enabled: boolean
  config: Record<string, any>
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(
  userId: string,
  event: CalendarEvent
): Promise<{ success: boolean; event_id?: string; error?: string }> {
  const connection = await getCalendarConnection(userId)

  if (!connection) {
    return { success: false, error: 'No calendar connected' }
  }

  // Refresh token if expired
  if (new Date() > new Date(connection.token_expires_at)) {
    await refreshAccessToken(connection)
  }

  switch (connection.provider) {
    case 'google_calendar':
      return await createGoogleCalendarEvent(connection, event)
    case 'apple_calendar':
      return await createAppleCalendarEvent(connection, event)
    case 'outlook_calendar':
      return await createOutlookCalendarEvent(connection, event)
    default:
      return { success: false, error: 'Unsupported calendar provider' }
  }
}

/**
 * Google Calendar Event Creation
 */
async function createGoogleCalendarEvent(
  connection: CalendarConnection,
  event: CalendarEvent
): Promise<{ success: boolean; event_id?: string; error?: string }> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'UTC',
          },
          reminders: event.reminders
            ? {
                useDefault: false,
                overrides: event.reminders.map((minutes) => ({
                  method: 'popup',
                  minutes,
                })),
              }
            : { useDefault: true },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Google Calendar API error: ${error}` }
    }

    const data = await response.json()

    return { success: true, event_id: data.id }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Apple Calendar Event Creation (via CalDAV)
 */
async function createAppleCalendarEvent(
  connection: CalendarConnection,
  event: CalendarEvent
): Promise<{ success: boolean; event_id?: string; error?: string }> {
  // Implement CalDAV integration for Apple Calendar
  // See: https://developer.apple.com/documentation/cloudkit

  return { success: false, error: 'Apple Calendar integration not yet implemented' }
}

/**
 * Outlook Calendar Event Creation
 */
async function createOutlookCalendarEvent(
  connection: CalendarConnection,
  event: CalendarEvent
): Promise<{ success: boolean; event_id?: string; error?: string }> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: event.title,
        body: {
          contentType: 'Text',
          content: event.description || '',
        },
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        location: {
          displayName: event.location || '',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Outlook Calendar API error: ${error}` }
    }

    const data = await response.json()

    return { success: true, event_id: data.id }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Get user's calendar connection
 */
async function getCalendarConnection(userId: string): Promise<CalendarConnection | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('user_id', userId)
    .in('provider', ['google_calendar', 'apple_calendar', 'outlook_calendar'])
    .eq('enabled', true)
    .single()

  return data as CalendarConnection | null
}

/**
 * Refresh OAuth access token
 */
async function refreshAccessToken(connection: CalendarConnection): Promise<void> {
  const supabase = await createClient()

  let newTokenData: any

  switch (connection.provider) {
    case 'google_calendar':
      newTokenData = await refreshGoogleToken(connection)
      break
    case 'outlook_calendar':
      newTokenData = await refreshOutlookToken(connection)
      break
    default:
      throw new Error('Token refresh not supported for this provider')
  }

  // Update connection with new tokens
  await supabase
    .from('integration_connections')
    .update({
      access_token: newTokenData.access_token,
      token_expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
    })
    .eq('id', connection.id)
}

async function refreshGoogleToken(connection: CalendarConnection): Promise<any> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: connection.refresh_token!,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google token')
  }

  return await response.json()
}

async function refreshOutlookToken(connection: CalendarConnection): Promise<any> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      refresh_token: connection.refresh_token!,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Outlook token')
  }

  return await response.json()
}
