export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          created_at: string
          updated_at: string
          plan: 'free' | 'premium'
          roles: string[]
          stripe_customer_id: string | null
          email: string | null
        }
        Insert: {
          user_id: string
          created_at?: string
          updated_at?: string
          plan?: 'free' | 'premium'
          roles?: string[]
          stripe_customer_id?: string | null
          email?: string | null
        }
        Update: {
          user_id?: string
          created_at?: string
          updated_at?: string
          plan?: 'free' | 'premium'
          roles?: string[]
          stripe_customer_id?: string | null
          email?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          ciphertext: string
          iv: string
          algo_version: string
          tags: string[]
          metadata: any
        }
      }
      usage_daily: {
        Row: {
          user_id: string
          date: string
          flame_calls: number
          created_at: string
          updated_at: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string | null
          created_at: string
          event_type: string
          metadata: any
        }
      }
    }
  }
}
