# Feature Gates Enforcement Checklist

**Status:** In Progress
**Last Updated:** 2026-01-20
**CRITICAL:** Server-side enforcement prevents ALL client bypass

---

## ✅ Core Principle

**NO client-side feature gates are trusted.**

All tier/feature checks MUST happen on the server:
- Server Actions (`lib/actions/*.ts`)
- API Routes (`app/api/*/route.ts`)
- Background Jobs (cron routes)

Client receives only **UI hints** (disable buttons, show upgrade prompts).

---

## 🔒 Enforcement Status

### Tier 0: Base (FREE) Features

| Feature | Gate Required | Status | File | Line |
|---------|--------------|--------|------|------|
| Avatar selection | ❌ No (universal) | N/A | - | - |
| Text conversations (5/day) | ✅ Yes | ✅ **ENFORCED** | `lib/actions/flame.ts` | 26-63 |
| Daily mood check-in | ❌ No (universal) | N/A | - | - |
| Crisis detection | ❌ No (universal) | N/A | `lib/flame/engine.ts` | - |
| Privacy controls | ❌ No (universal) | N/A | - | - |

---

### Tier 1: Standard ($9/mo) Features

| Feature | Gate Required | Status | File | Line |
|---------|--------------|--------|------|------|
| Age tier switching | ✅ Yes | ⏳ TODO | `lib/actions/avatar.ts` | - |
| Journaling (encrypted) | ✅ Yes | ⏳ TODO | `lib/actions/journal.ts` | - |
| Guided coping modules | ✅ Yes | ⏳ TODO | `lib/actions/coping.ts` | - |
| Daily goals (3 max) | ✅ Yes | ⏳ TODO | `lib/actions/goals.ts` | - |
| Text conversations (25/day) | ✅ Yes | ✅ **ENFORCED** | `lib/actions/flame.ts` | 26-63 |

**Checklist:**
- [ ] Create `lib/actions/avatar.ts` with `updateAgeTier()`
- [ ] Create `lib/actions/journal.ts` with tier check
- [ ] Create `lib/actions/goals.ts` with `createGoal()` + max limit check
- [ ] Create `lib/actions/coping.ts` with tier check

---

### Tier 2: Enhanced ($24/mo) Features

| Feature | Gate Required | Status | File | Line |
|---------|--------------|--------|------|------|
| Voice TTS | ✅ Yes | ⏳ TODO | `lib/actions/voice.ts` | - |
| Voice STT | ✅ Yes | ⏳ TODO | `lib/actions/voice.ts` | - |
| Weekly summaries | ✅ Yes | ⏳ TODO | `lib/actions/analytics.ts` | - |
| Mood analytics | ✅ Yes | ⏳ TODO | `lib/actions/analytics.ts` | - |
| Mini-courses | ✅ Yes | ⏳ TODO | `lib/actions/courses.ts` | - |
| Unlimited journaling | ✅ Yes | ⏳ TODO | `lib/actions/journal.ts` | - |
| Text conversations (75/day) | ✅ Yes | ✅ **ENFORCED** | `lib/actions/flame.ts` | 26-63 |

**Checklist:**
- [ ] Create `lib/actions/voice.ts`:
  - `generateSpeech(text)` → checks tier ≥ 2
  - `transcribeSpeech(audioBlob)` → checks tier ≥ 2
- [ ] Create `lib/actions/analytics.ts`:
  - `getWeeklySummary()` → checks tier ≥ 2
  - `getMoodTrends()` → checks tier ≥ 2
- [ ] Create `lib/actions/courses.ts`:
  - `enrollCourse(courseId)` → checks tier ≥ 2

---

### Tier 3: Pro ($49/mo) Features

| Feature | Gate Required | Status | File | Line |
|---------|--------------|--------|------|------|
| Calendar sync | ✅ Yes | ⏳ TODO | `lib/actions/integrations.ts` | - |
| Wearable data | ✅ Yes | ⏳ TODO | `lib/actions/integrations.ts` | - |
| API access | ✅ Yes | ⏳ TODO | `app/api/v1/*/route.ts` | - |
| Unlimited conversations | ✅ Yes | ✅ **ENFORCED** | `lib/actions/flame.ts` | 54 |
| Advanced analytics export | ✅ Yes | ⏳ TODO | `lib/actions/analytics.ts` | - |

**Checklist:**
- [ ] Create `lib/actions/integrations.ts`:
  - `connectCalendar(provider)` → checks tier ≥ 3
  - `connectWearable(provider)` → checks tier ≥ 3
  - `disconnectIntegration(provider)` → checks tier ≥ 3
- [ ] Create `app/api/v1/flame/route.ts`:
  - API key validation
  - Check user tier ≥ 3 via API key → user_id → entitlements
- [ ] Create `app/api/v1/analytics/route.ts`:
  - Same tier check pattern
- [ ] Update `lib/actions/analytics.ts`:
  - `exportAnalytics(format)` → checks tier ≥ 3

---

### Tier 4: Infinite ($99/mo) Features

| Feature | Gate Required | Status | File | Line |
|---------|--------------|--------|------|------|
| Custom avatar visuals | ✅ Yes | ⏳ TODO | `lib/actions/avatar.ts` | - |
| Personality sliders | ✅ Yes | ⏳ TODO | `lib/actions/avatar.ts` | - |
| Predictive insights | ✅ Yes | ⏳ TODO | `lib/actions/analytics.ts` | - |
| Human-AI coaching | ✅ Yes | ⏳ TODO | `lib/actions/coaching.ts` | - |
| Concierge support | ✅ Yes | ⏳ TODO | - | Manual |

**Checklist:**
- [ ] Update `lib/actions/avatar.ts`:
  - `uploadCustomAvatar(imageUrl)` → checks tier ≥ 4
  - `updatePersonalitySliders(settings)` → checks tier ≥ 4
- [ ] Create `lib/actions/coaching.ts`:
  - `requestCoaching()` → checks tier ≥ 4
  - `scheduleSession(datetime)` → checks tier ≥ 4
- [ ] Update `lib/actions/analytics.ts`:
  - `getPredictiveInsights()` → checks tier ≥ 4

---

## 🛡️ Enforcement Pattern (Template)

### Server Action Pattern

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { checkFeature, requireTier } from '@/lib/features/flags'

export async function premiumFeatureAction(params: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // METHOD 1: Check specific feature
  const { entitled, reason, required_tier } = await checkFeature(
    user.id,
    'voice_interaction' // from FeatureKey enum
  )

  if (!entitled) {
    return {
      success: false,
      error: reason,
      upgrade_required: true,
      required_tier,
    }
  }

  // OR METHOD 2: Require minimum tier (throws error if insufficient)
  try {
    await requireTier(user.id, 2) // Tier 2+ required
  } catch (error) {
    return {
      success: false,
      error: error.message,
      upgrade_required: true,
    }
  }

  // Execute feature logic...
  return { success: true, data: {...} }
}
```

### API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { checkFeature } from '@/lib/features/flags'

export async function POST(req: NextRequest) {
  // Extract API key from header
  const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  // Validate API key and get user_id
  const supabase = await createClient()
  const { data: keyData } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', apiKey)
    .eq('active', true)
    .single()

  if (!keyData) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Check API access entitlement (Tier 3+)
  const { entitled } = await checkFeature(keyData.user_id, 'api_access')

  if (!entitled) {
    return NextResponse.json(
      { error: 'API access requires Pro tier or higher' },
      { status: 403 }
    )
  }

  // Execute API logic...
  return NextResponse.json({ success: true, data: {...} })
}
```

---

## 🔍 Verification Commands

### Check Server-Side Enforcement

```bash
# Find all feature checks
grep -r "checkFeature\|requireTier" lib/actions/ app/api/

# Find missing checks (files that should have gates but don't)
grep -r "voice\|analytics\|calendar\|wearable\|api_access" lib/actions/ | grep -v "checkFeature"

# Find hardcoded tier checks (replace with checkFeature)
grep -r "current_tier >=" lib/ app/
```

### Database Query to Verify Entitlements

```sql
-- Check entitlement enforcement
SELECT
  user_id,
  current_tier,
  flame_conversations_per_day,
  daily_goals_max,
  api_calls_per_day
FROM entitlements
WHERE user_id = 'TEST_USER_ID';

-- Verify feature flags loaded from tier_matrix.json
SELECT
  current_tier,
  features
FROM entitlements
WHERE user_id = 'TEST_USER_ID';
```

### Test Cases

**Tier 0 User tries Voice:**
```bash
curl -X POST https://yourdomain.com/api/voice/generate \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"text": "test"}'

Expected: 403 Forbidden
Response: { "error": "Requires Enhanced tier or higher", "upgrade_required": true }
```

**Tier 3 User tries Custom Avatar:**
```bash
curl -X POST https://yourdomain.com/api/avatar/upload \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "image=@avatar.png"

Expected: 403 Forbidden
Response: { "error": "Requires Infinite tier", "upgrade_required": true }
```

---

## 📊 Progress Tracking

### Completed (1/7 Tiers)
- ✅ Flame conversation limits (all tiers)

### In Progress (0/7)
- ⏳ None

### TODO (6/7)
- ⏳ Tier 1: Journaling, Goals, Age tier switching
- ⏳ Tier 2: Voice (TTS/STT), Analytics, Mini-courses
- ⏳ Tier 3: Calendar, Wearables, API access
- ⏳ Tier 4: Custom avatar, Predictive insights, Coaching

---

## 🚨 Critical Violations

**NEVER do these:**

❌ **Client-side tier check only:**
```tsx
// BAD: Client can bypass this
{user.tier >= 2 && <VoiceButton />}
```

❌ **No server-side validation:**
```typescript
// BAD: API route with no tier check
export async function POST(req: NextRequest) {
  const data = await generateSpeech(text) // Anyone can call this!
  return NextResponse.json(data)
}
```

❌ **Hardcoded tier numbers:**
```typescript
// BAD: Magic numbers
if (entitlement.current_tier >= 2) { ... }

// GOOD: Use checkFeature or requireTier
const { entitled } = await checkFeature(userId, 'voice_interaction')
```

---

## ✅ Definition of Done (Feature Gates)

All premium features MUST have:
- [x] Server-side tier check using `checkFeature()` or `requireTier()`
- [ ] Upgrade prompt returned on insufficient tier
- [ ] Test case verifying tier enforcement
- [ ] No client-side bypass possible
- [ ] Consistent error messaging
- [ ] Audit log entry (optional for high-value features)

**Target:** 100% server-side enforcement before production launch

---

**Next Action:** Create server actions for Tier 1-4 features with proper gates.
