# RYVYNN Avatar System + Pricing Tiers
## Developer Handoff Documentation v1.0

**Last Updated**: January 20, 2026
**Author**: OMEGA BUILDER
**Status**: Production-Ready Implementation Guide

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Extensions](#database-schema-extensions)
3. [Feature Flag System](#feature-flag-system)
4. [Avatar Engine Integration](#avatar-engine-integration)
5. [Environment Variables](#environment-variables)
6. [API Reference](#api-reference)
7. [Integration Guides](#integration-guides)
8. [Testing Checklist](#testing-checklist)
9. [Deployment Notes](#deployment-notes)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js 15 App Router)        │
│  - Avatar selection UI (/app/onboarding)        │
│  - Tier comparison & upgrade flows              │
│  - Feature gate UI components                   │
│  - Settings: avatar customization               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│       Server Actions & API Routes               │
│  - lib/actions/avatar.ts                        │
│  - lib/actions/entitlements.ts                  │
│  - lib/actions/analytics.ts                     │
│  - app/api/webhooks/stripe (existing)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Core Business Logic (lib/)              │
│  - lib/avatar/engine.ts                         │
│  - lib/features/flags.ts                        │
│  - lib/integrations/{calendar,wearables,tts}    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│        Supabase (Database + Auth + Storage)     │
│  Tables:                                        │
│  - avatar_profiles (NEW)                        │
│  - user_preferences (NEW)                       │
│  - entitlements (NEW)                           │
│  - mood_logs (NEW)                              │
│  - goals (NEW)                                  │
│  - streaks (NEW)                                │
│  - analytics_summaries (NEW)                    │
│  - profiles, subscriptions (EXISTING)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            External Integrations                │
│  - Stripe (existing): billing & subscriptions   │
│  - TTS Provider (NEW): ElevenLabs or similar    │
│  - STT Provider (NEW): Deepgram or Whisper      │
│  - Calendar APIs (NEW): Google, Apple, Outlook  │
│  - Wearable APIs (NEW): Apple Health, Fitbit    │
└─────────────────────────────────────────────────┘
```

### Data Flow: Flame Response Generation

```
User Message
    ↓
Server Action: callFlame(message)
    ↓
Feature Check: checkEntitlement(userId, 'flame_conversation')
    ↓
Avatar Profile Load: getAvatarProfile(userId)
    ↓
Avatar Engine: generateResponse(message, profile, history)
    ├─→ Crisis Detection (all tiers)
    ├─→ Emotion Detection
    ├─→ Load Context (tier-dependent)
    ├─→ Apply Persona Styling (gender)
    ├─→ Apply Age Tier Context
    └─→ Generate Response
    ↓
TTS Conversion (if tier ≥ 2 && voice enabled)
    ↓
Analytics Logging (if tier ≥ 2)
    ↓
Response Delivered {text, audio_url?, metadata}
```

---

## Database Schema Extensions

### New Tables

#### `avatar_profiles`
Stores user avatar configuration and customizations.

```sql
CREATE TABLE avatar_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Core Avatar Settings
  gender_persona TEXT NOT NULL DEFAULT 'feminine' CHECK (gender_persona IN ('feminine', 'masculine', 'nonbinary')),
  age_tier TEXT NOT NULL DEFAULT 'young_adult' CHECK (age_tier IN ('youth', 'young_adult', 'adult', 'mature')),
  avatar_name TEXT NOT NULL DEFAULT 'Aria',

  -- Tier 4: Custom Avatar Settings
  custom_visual_url TEXT, -- uploaded or generated avatar image
  personality_warmth INT DEFAULT 5 CHECK (personality_warmth BETWEEN 1 AND 10),
  personality_directness INT DEFAULT 5 CHECK (personality_directness BETWEEN 1 AND 10),
  personality_humor INT DEFAULT 5 CHECK (personality_humor BETWEEN 1 AND 10),
  personality_formality INT DEFAULT 5 CHECK (personality_formality BETWEEN 1 AND 10),

  -- Voice Settings (Tier 2+)
  voice_enabled BOOLEAN DEFAULT FALSE,
  voice_id TEXT, -- TTS provider voice ID

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE avatar_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar profile"
  ON avatar_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar profile"
  ON avatar_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_avatar_profiles_updated_at
  BEFORE UPDATE ON avatar_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### `entitlements`
Tracks user tier and feature access.

```sql
CREATE TABLE entitlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Tier Information
  current_tier INT NOT NULL DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4),
  subscription_id TEXT, -- Stripe subscription ID

  -- Usage Limits
  flame_conversations_per_day INT NOT NULL DEFAULT 5,
  daily_goals_max INT NOT NULL DEFAULT 0,
  api_calls_per_day INT NOT NULL DEFAULT 0,
  journal_retention_days INT, -- NULL = unlimited

  -- Feature Flags
  features JSONB DEFAULT '{}', -- { "voice_interaction": true, "calendar_sync": true, ... }

  -- Add-ons
  purchased_addons TEXT[] DEFAULT '{}', -- ['avatar_pack_1', 'voice_pack_premium']

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can modify entitlements (via service role)
```

#### `mood_logs`
Tracks daily mood check-ins for analytics.

```sql
CREATE TABLE mood_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  mood_emoji TEXT NOT NULL, -- '😊', '😢', '😰', etc.
  mood_text TEXT, -- optional freeform description
  intensity INT CHECK (intensity BETWEEN 1 AND 5), -- 1=slight, 5=extreme

  -- Context
  tags TEXT[], -- ['work', 'relationships', 'health']

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  logged_at DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, logged_at DESC);

-- RLS
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mood logs"
  ON mood_logs FOR ALL
  USING (auth.uid() = user_id);
```

#### `goals`
Daily goal tracking (Tier 1+).

```sql
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  goal_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Scheduling
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reminder_time TIME,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_date ON goals(user_id, goal_date DESC);

-- RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);
```

#### `analytics_summaries`
Pre-computed weekly/monthly summaries (Tier 2+).

```sql
CREATE TABLE analytics_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Computed Metrics
  mood_trend TEXT, -- 'improving', 'stable', 'declining'
  most_common_mood TEXT,
  journal_entries_count INT,
  flame_conversations_count INT,
  goals_completed_count INT,
  streak_days INT,

  -- Insights
  patterns JSONB, -- { "monday_anxiety": true, "evening_stress": true }
  recommendations TEXT[], -- ['Try 5-minute calm on Mondays', 'Schedule breaks']

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

-- RLS
ALTER TABLE analytics_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_summaries FOR SELECT
  USING (auth.uid() = user_id);
```

#### `integration_connections`
Stores third-party integration credentials (Tier 3+).

```sql
CREATE TABLE integration_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  provider TEXT NOT NULL, -- 'google_calendar', 'apple_health', 'fitbit', etc.
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMPTZ,

  -- Configuration
  config JSONB DEFAULT '{}', -- provider-specific settings
  enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations"
  ON integration_connections FOR ALL
  USING (auth.uid() = user_id);
```

### Modified Tables

#### `profiles` (Existing Table - Add Columns)

```sql
-- Add tier tracking to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_tier INT DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

---

## Feature Flag System

### Implementation: `lib/features/flags.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { Tier } from '@/types/tiers'

export interface FeatureFlag {
  feature_key: string
  minimum_tier: Tier
  requires_addon?: string
  enabled: boolean
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeature(
  userId: string,
  featureKey: string
): Promise<{ entitled: boolean; reason?: string }> {
  const supabase = await createClient()

  // Get user entitlements
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('current_tier, features, purchased_addons')
    .eq('user_id', userId)
    .single()

  if (!entitlement) {
    return { entitled: false, reason: 'No entitlement record found' }
  }

  // Load feature definition from tier_matrix.json
  const featureDefinition = getFeatureDefinition(featureKey)

  if (!featureDefinition) {
    return { entitled: false, reason: 'Feature not found' }
  }

  // Check global kill switch
  if (!featureDefinition.enabled) {
    return { entitled: false, reason: 'Feature temporarily disabled' }
  }

  // Check tier requirement
  if (entitlement.current_tier < featureDefinition.minimum_tier) {
    return {
      entitled: false,
      reason: `Requires tier ${featureDefinition.minimum_tier} or higher`,
    }
  }

  // Check add-on requirement
  if (featureDefinition.requires_addon) {
    const hasAddon = (entitlement.purchased_addons || []).includes(
      featureDefinition.requires_addon
    )
    if (!hasAddon) {
      return {
        entitled: false,
        reason: `Requires add-on: ${featureDefinition.requires_addon}`,
      }
    }
  }

  return { entitled: true }
}

/**
 * Require minimum tier or throw error
 */
export async function requireTier(userId: string, minTier: Tier): Promise<void> {
  const supabase = await createClient()

  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('current_tier')
    .eq('user_id', userId)
    .single()

  if (!entitlement || entitlement.current_tier < minTier) {
    throw new Error(`This feature requires tier ${minTier} or higher`)
  }
}

/**
 * Get user's current tier
 */
export async function getCurrentTier(userId: string): Promise<Tier> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('entitlements')
    .select('current_tier')
    .eq('user_id', userId)
    .single()

  return (data?.current_tier as Tier) || 0
}

/**
 * Load feature definition from tier_matrix.json
 */
function getFeatureDefinition(featureKey: string): FeatureFlag | null {
  // In production, load from /data/tier_matrix.json
  // For now, reference the feature_keys array
  const tierMatrix = require('@/data/tier_matrix.json')
  return tierMatrix.feature_keys.find((f: any) => f.feature_key === featureKey) || null
}
```

### Usage Example

```typescript
// In a server action
export async function enableVoice() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Check entitlement
  const { entitled, reason } = await checkFeature(user.id, 'voice_interaction')

  if (!entitled) {
    return {
      success: false,
      error: reason,
      upgrade_required: true,
      minimum_tier: 2,
    }
  }

  // Enable voice...
  await updateAvatarProfile(user.id, { voice_enabled: true })

  return { success: true }
}
```

---

## Avatar Engine Integration

### Implementation: `lib/avatar/engine.ts`

```typescript
import { AvatarProfile, GenderPersona, AgeTier } from '@/types/avatars'
import { FlameResponse, FlameInput } from '@/types/flame'
import { detectCrisisLevel, getCrisisSafetyMessage } from '@/lib/flame/engine'

/**
 * Generate Flame response with avatar persona styling
 */
export function generateAvatarResponse(
  input: FlameInput,
  profile: AvatarProfile,
  userHistory?: any // tier-dependent
): FlameResponse {
  // 1. Crisis Detection (all tiers)
  const { isCrisis, level } = detectCrisisLevel(input.message)

  if (isCrisis && level) {
    return {
      text: getCrisisSafetyMessage(level),
      is_crisis: true,
      crisis_level: level,
    }
  }

  // 2. Emotion Detection
  const primaryEmotion = detectEmotion(input.message)

  // 3. Load persona templates
  const personaData = loadGenderPersona(profile.gender_persona)
  const ageTierData = loadAgeTier(profile.age_tier)

  // 4. Generate base response
  const baseResponse = generateBaseResponse(primaryEmotion, input.message)

  // 5. Apply persona styling
  const reflection = applyPersonaStyling(
    baseResponse.reflection,
    personaData,
    'reflection'
  )
  const nextStep = applyAgeTier(baseResponse.next_step, ageTierData)
  const copingTool = selectCopingTool(primaryEmotion, ageTierData)

  // 6. Apply custom personality (Tier 4 only)
  let finalText = `${reflection}\n\n${nextStep}\n\n${copingTool}`

  if (profile.personality_warmth) {
    finalText = applyPersonalitySliders(finalText, profile)
  }

  return {
    text: finalText,
    emotion: primaryEmotion,
    is_crisis: false,
  }
}

/**
 * Apply gender persona language patterns
 */
function applyPersonaStyling(
  text: string,
  persona: GenderPersona,
  type: 'reflection' | 'next_step'
): string {
  // Load response_patterns from avatar_profiles.json
  const patterns = persona.response_patterns

  if (type === 'reflection') {
    return patterns.reflection_prefix + ' ' + text
  }

  return text
}

/**
 * Apply age tier context and examples
 */
function applyAgeTier(text: string, ageTier: AgeTier): string {
  // Replace generic examples with age-appropriate ones
  // Use ageTier.language_adjustments.examples
  return text // simplified for now
}

/**
 * Select appropriate coping tool based on emotion and age tier
 */
function selectCopingTool(emotion: string, ageTier: AgeTier): string {
  // Load coping_modules from avatar_profiles.json
  const modules = require('@/data/avatar_profiles.json').coping_modules

  // Filter by available_tiers
  const available = modules.filter((m: any) =>
    m.available_tiers.includes(ageTierToNumber(ageTier.id))
  )

  // Select randomly or based on emotion
  const selected = available[0] // simplified

  return formatCopingModule(selected)
}

/**
 * Apply custom personality sliders (Tier 4 only)
 */
function applyPersonalitySliders(text: string, profile: AvatarProfile): string {
  // Adjust warmth, directness, humor, formality
  // Scale 1-10 where 5 is default

  let adjusted = text

  // Example: Increase warmth
  if (profile.personality_warmth && profile.personality_warmth > 5) {
    adjusted = adjusted.replace(/\./g, '. 💙')
  }

  // Example: Increase directness
  if (profile.personality_directness && profile.personality_directness > 7) {
    adjusted = adjusted.replace(/you might/g, 'you should')
  }

  return adjusted
}

// Helper functions
function loadGenderPersona(id: string): GenderPersona {
  const profiles = require('@/data/avatar_profiles.json')
  return profiles.gender_personas.find((p: any) => p.id === id)
}

function loadAgeTier(id: string): AgeTier {
  const profiles = require('@/data/avatar_profiles.json')
  return profiles.age_tiers.find((a: any) => a.id === id)
}

function ageTierToNumber(id: string): number {
  const map: any = { youth: 1, young_adult: 2, adult: 3, mature: 4 }
  return map[id] || 1
}

function detectEmotion(message: string): string {
  // Existing emotion detection from lib/flame/engine.ts
  return 'anxious' // simplified
}

function generateBaseResponse(emotion: string, message: string): any {
  // Existing Flame logic
  return {
    reflection: `It sounds like you're feeling ${emotion}.`,
    next_step: 'One thing you could try: take a 5-minute break.',
    coping_tool: 'Try deep breathing for 1 minute.',
  }
}

function formatCopingModule(module: any): string {
  return `**${module.name}**: ${module.description}\n${module.steps.join('\n')}`
}
```

---

## Environment Variables

### Existing Variables (from original RYVYNN)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # NEVER expose to client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Tier Price IDs (existing)
STRIPE_PRICE_ID_PREMIUM=price_xxx # Legacy - now Tier 1

# App
NEXT_PUBLIC_APP_URL=https://app.ryvynn.com
ADMIN_EMAILS=admin@ryvynn.com
```

### New Variables (Avatar System)

```bash
# Stripe Price IDs (New Tiers)
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_xxx  # Tier 1 - $9/mo
STRIPE_PRICE_ID_STANDARD_ANNUAL=price_xxx   # Tier 1 - $90/yr
STRIPE_PRICE_ID_ENHANCED_MONTHLY=price_xxx  # Tier 2 - $24/mo
STRIPE_PRICE_ID_ENHANCED_ANNUAL=price_xxx   # Tier 2 - $240/yr
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx       # Tier 3 - $49/mo
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxx        # Tier 3 - $490/yr
STRIPE_PRICE_ID_INFINITE_MONTHLY=price_xxx  # Tier 4 - $99/mo
STRIPE_PRICE_ID_INFINITE_ANNUAL=price_xxx   # Tier 4 - $990/yr

# Text-to-Speech (Tier 2+)
TTS_PROVIDER=elevenlabs # or 'openai' or 'google'
TTS_API_KEY=sk_xxx
TTS_VOICE_FEMININE=voice_id_xxx
TTS_VOICE_MASCULINE=voice_id_xxx
TTS_VOICE_NONBINARY=voice_id_xxx

# Speech-to-Text (Tier 2+)
STT_PROVIDER=deepgram # or 'whisper' or 'google'
STT_API_KEY=xxx

# Calendar Integration (Tier 3+)
GOOGLE_CALENDAR_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
APPLE_CALENDAR_CLIENT_ID=xxx # if using CloudKit
OUTLOOK_CLIENT_ID=xxx
OUTLOOK_CLIENT_SECRET=xxx

# Wearable Integrations (Tier 3+)
APPLE_HEALTH_CLIENT_ID=xxx # if using HealthKit web API
FITBIT_CLIENT_ID=xxx
FITBIT_CLIENT_SECRET=xxx
GARMIN_CONSUMER_KEY=xxx
GARMIN_CONSUMER_SECRET=xxx

# Analytics (Tier 2+)
ANALYTICS_COMPUTE_CRON_SECRET=xxx # for scheduled summary generation

# Add-Ons
STRIPE_PRICE_ID_AVATAR_PACK=price_xxx      # $4.99 one-time
STRIPE_PRICE_ID_VOICE_PACK=price_xxx       # $7.99 one-time
STRIPE_PRICE_ID_ANALYTICS_REPORT=price_xxx # $9.99 one-time
STRIPE_PRICE_ID_COMMUNITY_DASHBOARD=price_xxx # $14/mo
STRIPE_PRICE_ID_CLINICIAN_DASHBOARD=price_xxx # $29/mo
```

### `.env.local` Template

```bash
# Copy this to .env.local and fill in your values

# === CORE (Required) ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=

# === TIERS (Required) ===
STRIPE_PRICE_ID_STANDARD_MONTHLY=
STRIPE_PRICE_ID_STANDARD_ANNUAL=
STRIPE_PRICE_ID_ENHANCED_MONTHLY=
STRIPE_PRICE_ID_ENHANCED_ANNUAL=
STRIPE_PRICE_ID_PRO_MONTHLY=
STRIPE_PRICE_ID_PRO_ANNUAL=
STRIPE_PRICE_ID_INFINITE_MONTHLY=
STRIPE_PRICE_ID_INFINITE_ANNUAL=

# === TTS (Optional - Tier 2+) ===
TTS_PROVIDER=elevenlabs
TTS_API_KEY=
TTS_VOICE_FEMININE=
TTS_VOICE_MASCULINE=
TTS_VOICE_NONBINARY=

# === STT (Optional - Tier 2+) ===
STT_PROVIDER=deepgram
STT_API_KEY=

# === INTEGRATIONS (Optional - Tier 3+) ===
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
```

---

## API Reference

### Server Actions

#### `lib/actions/avatar.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { AvatarProfile } from '@/types/avatars'
import { requireTier } from '@/lib/features/flags'

/**
 * Get user's avatar profile
 */
export async function getAvatarProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('avatar_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data as AvatarProfile
}

/**
 * Update avatar profile
 */
export async function updateAvatarProfile(updates: Partial<AvatarProfile>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check tier requirements for specific fields
  if (updates.age_tier && updates.age_tier !== user.profile?.age_tier) {
    await requireTier(user.id, 1) // Tier 1+ can change age tier
  }

  if (updates.custom_visual_url || updates.personality_warmth) {
    await requireTier(user.id, 4) // Tier 4 for customization
  }

  const { data, error } = await supabase
    .from('avatar_profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Create default avatar profile on signup
 */
export async function createDefaultAvatarProfile(
  userId: string,
  genderPersona: string,
  ageTier: string
) {
  const supabase = await createClient()

  // Select default name based on gender
  const defaultNames: any = {
    feminine: 'Aria',
    masculine: 'Atlas',
    nonbinary: 'Nova',
  }

  const { data, error } = await supabase
    .from('avatar_profiles')
    .insert({
      user_id: userId,
      gender_persona: genderPersona,
      age_tier: ageTier,
      avatar_name: defaultNames[genderPersona] || 'Flame',
    })
    .select()
    .single()

  if (error) throw error

  return data
}
```

#### `lib/actions/entitlements.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { Tier } from '@/types/tiers'
import { checkFeature } from '@/lib/features/flags'

/**
 * Check feature entitlement
 */
export async function checkEntitlement(featureKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { entitled: false, reason: 'Not authenticated' }
  }

  return await checkFeature(user.id, featureKey)
}

/**
 * Get user's tier and limits
 */
export async function getUserEntitlements() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

/**
 * Update user tier (called by Stripe webhook)
 */
export async function updateUserTier(userId: string, tier: Tier) {
  const supabase = await createClient()

  // Load tier limits from tier_matrix.json
  const tierMatrix = require('@/data/tier_matrix.json')
  const tierData = tierMatrix.tiers.find((t: any) => t.id === tier)

  const { error } = await supabase
    .from('entitlements')
    .upsert({
      user_id: userId,
      current_tier: tier,
      flame_conversations_per_day: tierData.limits.flame_conversations_per_day,
      daily_goals_max: tierData.limits.daily_goals_max,
      api_calls_per_day: tierData.limits.api_calls_per_day,
      journal_retention_days: tierData.limits.journal_retention_days,
      features: tierData.features,
    })

  if (error) throw error

  // Also update profiles table
  await supabase
    .from('profiles')
    .update({ current_tier: tier })
    .eq('user_id', userId)
}
```

#### `lib/actions/analytics.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireTier } from '@/lib/features/flags'

/**
 * Get weekly summary (Tier 2+)
 */
export async function getWeeklySummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  await requireTier(user.id, 2) // Enhanced tier required

  const { data } = await supabase
    .from('analytics_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('period_type', 'weekly')
    .order('period_start', { ascending: false })
    .limit(1)
    .single()

  return data
}

/**
 * Log mood check-in
 */
export async function logMoodCheckIn(mood_emoji: string, mood_text?: string, tags?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: user.id,
      mood_emoji,
      mood_text,
      tags,
    })
    .select()
    .single()

  if (error) throw error

  return data
}
```

### REST API Routes (Tier 3+)

#### `app/api/v1/flame/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkFeature } from '@/lib/features/flags'
import { callFlame } from '@/lib/actions/flame'

export async function POST(req: NextRequest) {
  // Extract API key from Authorization header
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  // Validate API key and get user
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', apiKey)
    .eq('active', true)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Check API access entitlement (Tier 3+)
  const { entitled } = await checkFeature(user.user_id, 'api_access')

  if (!entitled) {
    return NextResponse.json(
      { error: 'API access requires Pro tier or higher' },
      { status: 403 }
    )
  }

  // Parse request
  const { message, include_voice } = await req.json()

  // Call Flame
  const response = await callFlame(message)

  return NextResponse.json(response)
}
```

---

## Integration Guides

### Text-to-Speech (Tier 2+)

#### `lib/integrations/tts.ts`

```typescript
export interface TTSRequest {
  text: string
  voice_id: string
  gender_persona: 'feminine' | 'masculine' | 'nonbinary'
}

export async function generateSpeech(request: TTSRequest): Promise<string> {
  const provider = process.env.TTS_PROVIDER || 'elevenlabs'

  switch (provider) {
    case 'elevenlabs':
      return await generateElevenLabs(request)
    case 'openai':
      return await generateOpenAI(request)
    default:
      throw new Error(`Unsupported TTS provider: ${provider}`)
  }
}

async function generateElevenLabs(request: TTSRequest): Promise<string> {
  const voiceId = getVoiceId(request.gender_persona)

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': process.env.TTS_API_KEY!,
    },
    body: JSON.stringify({
      text: request.text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`TTS failed: ${response.statusText}`)
  }

  // Upload to Supabase Storage
  const audioBuffer = await response.arrayBuffer()
  const fileName = `tts/${Date.now()}.mp3`

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
    })

  if (error) throw error

  // Get public URL
  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(fileName)

  return urlData.publicUrl
}

function getVoiceId(persona: string): string {
  const voiceMap: any = {
    feminine: process.env.TTS_VOICE_FEMININE,
    masculine: process.env.TTS_VOICE_MASCULINE,
    nonbinary: process.env.TTS_VOICE_NONBINARY,
  }

  return voiceMap[persona] || voiceMap.feminine
}

async function generateOpenAI(request: TTSRequest): Promise<string> {
  // Similar implementation for OpenAI TTS
  throw new Error('OpenAI TTS not yet implemented')
}
```

### Calendar Integration (Tier 3+)

#### `lib/integrations/calendar.ts`

```typescript
export interface CalendarEvent {
  title: string
  start: Date
  end: Date
  description?: string
}

export async function createCalendarEvent(
  userId: string,
  event: CalendarEvent
): Promise<void> {
  const supabase = await createClient()

  // Get user's calendar connection
  const { data: connection } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .eq('enabled', true)
    .single()

  if (!connection) {
    throw new Error('Calendar not connected')
  }

  // Refresh token if expired
  if (new Date() > new Date(connection.token_expires_at)) {
    await refreshGoogleToken(connection)
  }

  // Create event via Google Calendar API
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'UTC',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.statusText}`)
  }
}

async function refreshGoogleToken(connection: any): Promise<void> {
  // Implement OAuth token refresh
  throw new Error('Token refresh not yet implemented')
}
```

---

## Testing Checklist

### Unit Tests

- [ ] Feature flag system: entitlement checks for all tiers
- [ ] Avatar engine: persona styling for all 3 genders
- [ ] Avatar engine: age tier context for all 4 tiers
- [ ] Crisis detection: high/medium/low keywords
- [ ] Personality sliders: warmth, directness, humor, formality
- [ ] TTS integration: voice generation for all personas
- [ ] Calendar integration: event creation and OAuth flow
- [ ] Analytics: weekly summary computation

### Integration Tests

- [ ] Onboarding flow: avatar selection → tier selection → first message
- [ ] Upgrade flow: Base → Standard (test all tier combinations)
- [ ] Downgrade flow: Pro → Enhanced → verify feature revocation
- [ ] Stripe webhook: `checkout.session.completed` updates entitlements
- [ ] Stripe webhook: `customer.subscription.deleted` downgrades tier
- [ ] Voice toggle: enable voice → generate TTS → play audio
- [ ] Calendar sync: connect Google → create reminder → verify event
- [ ] API access: generate key → make authenticated request → verify response

### Manual Testing

- [ ] Create account → select Feminine avatar → verify response style
- [ ] Create account → select Youth age tier → verify age-appropriate examples
- [ ] Send crisis keyword → verify 988 banner displays immediately
- [ ] Hit 5/5 conversation limit on Base tier → verify upgrade prompt
- [ ] Upgrade to Standard → verify age tier switching works
- [ ] Upgrade to Enhanced → verify weekly summary email sends
- [ ] Upgrade to Pro → verify unlimited conversations
- [ ] Upgrade to Infinite → verify personality sliders affect responses
- [ ] Export data → verify all journal entries and mood logs included
- [ ] Delete account → verify 90-day grace period → hard delete

---

## Deployment Notes

### Database Migrations

Run migrations in this order:

```bash
# 1. Existing migrations (already applied in previous session)
# See /supabase/migrations/20260120000001_initial_schema.sql
# See /supabase/migrations/20260120000002_rls_policies.sql
# See /supabase/migrations/20260120000003_auth_triggers.sql

# 2. New migrations for avatar system
# Create these files:
# /supabase/migrations/20260120000004_avatar_tables.sql
# /supabase/migrations/20260120000005_avatar_rls.sql
```

### Stripe Configuration

1. Create 8 new Price IDs in Stripe Dashboard:
   - Standard Monthly ($9)
   - Standard Annual ($90)
   - Enhanced Monthly ($24)
   - Enhanced Annual ($240)
   - Pro Monthly ($49)
   - Pro Annual ($490)
   - Infinite Monthly ($99)
   - Infinite Annual ($990)

2. Create 5 Add-On Price IDs:
   - Avatar Pack ($4.99 one-time)
   - Voice Pack ($7.99 one-time)
   - Analytics Report ($9.99 one-time)
   - Community Dashboard ($14/mo)
   - Clinician Dashboard ($29/mo)

3. Update webhook handler to map Price IDs to tiers:

```typescript
// In app/api/webhooks/stripe/route.ts

const PRICE_TO_TIER_MAP: Record<string, number> = {
  [process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY!]: 1,
  [process.env.STRIPE_PRICE_ID_STANDARD_ANNUAL!]: 1,
  [process.env.STRIPE_PRICE_ID_ENHANCED_MONTHLY!]: 2,
  [process.env.STRIPE_PRICE_ID_ENHANCED_ANNUAL!]: 2,
  [process.env.STRIPE_PRICE_ID_PRO_MONTHLY!]: 3,
  [process.env.STRIPE_PRICE_ID_PRO_ANNUAL!]: 3,
  [process.env.STRIPE_PRICE_ID_INFINITE_MONTHLY!]: 4,
  [process.env.STRIPE_PRICE_ID_INFINITE_ANNUAL!]: 4,
}
```

### TTS Provider Setup

**Recommended: ElevenLabs**

1. Sign up at elevenlabs.io
2. Get API key
3. Create 3 voices (or use default voices):
   - Feminine voice (warm, medium pitch)
   - Masculine voice (steady, lower pitch)
   - Nonbinary voice (balanced, neutral pitch)
4. Add to environment variables

**Alternative: OpenAI TTS**

1. Use OpenAI API
2. Voices: `alloy` (feminine), `onyx` (masculine), `nova` (nonbinary)

### Cron Jobs

Set up Vercel Cron or similar:

```typescript
// app/api/cron/analytics/route.ts

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.ANALYTICS_COMPUTE_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Compute weekly summaries for all Enhanced+ users
  await computeWeeklySummaries()

  return NextResponse.json({ success: true })
}
```

Schedule: Every Sunday at 6 PM UTC

---

## Next Steps

1. **Create Database Migrations**: Run schema.sql for new tables
2. **Implement Feature Flags**: Build `/lib/features/flags.ts`
3. **Build Avatar Engine**: Complete `/lib/avatar/engine.ts`
4. **Update Stripe Webhook**: Add tier mapping
5. **Integrate TTS**: Implement `/lib/integrations/tts.ts`
6. **Build Onboarding UI**: Create avatar selection flow
7. **Build Tier Comparison Page**: Show features per tier
8. **Test End-to-End**: Follow testing checklist

---

## Support

For questions during implementation:
- **Technical Architecture**: See `/spec/RYVYNN_AVATAR_PRICING_SPEC.md`
- **Data Schemas**: See `/data/tier_matrix.json` and `/data/avatar_profiles.json`
- **Original RYVYNN Docs**: See `/DEPLOYMENT.md` and `/README.md`

---

**Built with OMEGA BUILDER**
**Privacy-First • Tesla-Style Pricing • Progressive Feature Unlocking**
