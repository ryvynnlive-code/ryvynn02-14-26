import { createBrowserClient as createClient } from '@supabase/ssr'

export function createBrowserClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        if (typeof document === 'undefined') return
        const cookie = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
      },
      set(name, value, options) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; ${options.maxAge ? `max-age=${options.maxAge};` : ''}`
      },
      remove(name, options) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=/; max-age=0`
      },
    },
  })
}
