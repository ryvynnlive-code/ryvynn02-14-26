# RYVYNN Avatar System + Tesla-Style Pricing
## Complete Product Specification v1.0

**Status**: Production-Ready Implementation Plan
**Date**: January 20, 2026
**Author**: OMEGA BUILDER

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Avatar System](#avatar-system)
4. [Feature Tiers](#feature-tiers)
5. [Pricing Strategy](#pricing-strategy)
6. [Technical Architecture](#technical-architecture)
7. [Feature Matrix](#feature-matrix)
8. [User Flows](#user-flows)
9. [Safety & Privacy](#safety--privacy)
10. [Acceptance Criteria](#acceptance-criteria)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Assumptions & Decisions](#assumptions--decisions)

---

## Executive Summary

RYVYNN evolves from a single mental wellness companion into a **personalized avatar-based system** with five distinct pricing tiers. Users select a gender persona (Feminine, Masculine, or Nonbinary/Custom) and age tier (Youth, Young Adult, Adult, Mature) to receive tailored guidance from "The Flame."

**Core Innovation**: Tesla-style pricing where features unlock progressively, not through separate products, but through tier upgrades. All tiers maintain RYVYNN's core principles: privacy-first, non-clinical, 4th-5th grade reading level, and crisis-aware routing.

**Business Model**: Freemium base tier with predictable recurring revenue through monthly/annual subscriptions plus optional add-on packs.

---

## Product Vision

### North Star
Provide accessible, personalized mental wellness support that adapts to user identity (gender, age) while maintaining privacy, safety, and simplicity.

### Core Principles
1. **Privacy-First**: Minimize data collection, enable opt-out, local-first processing where possible
2. **Safety-Aware**: Non-clinical support with crisis detection and emergency resource routing
3. **Accessible Language**: 4th-5th grade reading level, no jargon
4. **Progressive Enhancement**: Features unlock with higher tiers, not withheld arbitrarily
5. **Ethical Monetization**: Clear value at every tier, no dark patterns

---

## Avatar System

### 3.1 Gender Personas

Users select one of three gender-aligned personas that influence language style, tone, and example scenarios:

#### Feminine Avatar
- **Name Options**: "Aria," "Luna," "Sage" (user can customize)
- **Language Style**: Warm, nurturing, collaborative
- **Example Scenarios**: Work-life balance, relationships, self-care
- **Voice Profile** (Tier 2+): Warm, medium pitch, gentle pacing

#### Masculine Avatar
- **Name Options**: "Atlas," "Blaze," "Reed" (user can customize)
- **Language Style**: Direct, supportive, action-oriented
- **Example Scenarios**: Goal achievement, stress management, boundaries
- **Voice Profile** (Tier 2+): Steady, lower pitch, confident pacing

#### Nonbinary / Custom Gender
- **Name Options**: "Nova," "River," "Sky" (user can customize)
- **Language Style**: Neutral, affirming, flexible
- **Example Scenarios**: Identity exploration, authenticity, self-acceptance
- **Voice Profile** (Tier 2+): Balanced, neutral pitch, adaptive pacing

**Key Design Decision**: Personas influence style but NOT content quality. All avatars provide equally effective support; differences are presentation, not substance.

### 3.2 Age Tiers

Age tiers adapt developmental context, examples, and language complexity:

#### Youth (13-17)
- **Context Focus**: School, peer relationships, family dynamics, identity formation
- **Language**: Simple, affirming, age-appropriate examples
- **Safety**: Heightened crisis detection; parental notification options (with teen consent)
- **Content Guidelines**: Avoid adult-specific topics; emphasize resilience and growth mindset

#### Young Adult (18-29)
- **Context Focus**: Career, independence, relationships, life transitions
- **Language**: Relatable, contemporary references, exploration-friendly
- **Safety**: Standard crisis detection; resource emphasis on peer support
- **Content Guidelines**: Navigating adulthood, building life skills

#### Adult (30-49)
- **Context Focus**: Career stability, parenting, long-term relationships, health
- **Language**: Practical, time-conscious, responsibility-aware
- **Safety**: Standard crisis detection; family impact considerations
- **Content Guidelines**: Balance and sustainability emphasis

#### Mature (50+)
- **Context Focus**: Transitions, legacy, health management, relationships
- **Language**: Respectful, experienced-focused, wisdom-honoring
- **Safety**: Enhanced health monitoring suggestions; community connection emphasis
- **Content Guidelines**: Meaning-making, contribution, acceptance

**Key Design Decision**: Age tiers are self-selected (not verified) to respect privacy. Guidance adapts but remains universally applicable.

### 3.3 The Flame Response Engine Evolution

All avatars use "The Flame" engine, which generates:
1. **Reflection**: "What I hear you saying..."
2. **Next Step**: One actionable suggestion
3. **Coping Tool**: Simple technique

**Avatar Customization**: Response style adapts based on:
- Gender persona language patterns
- Age-appropriate examples and context
- User's tier-enabled features (e.g., analytics insights at Tier 2+)

---

## Feature Tiers

### 4.1 Tier 0: Ryvynn Base (FREE)

**Value Proposition**: Try RYVYNN's core support with no commitment

**Features**:
- ✅ Single avatar selection (choose gender persona)
- ✅ Standard Flame dialogues (reflection + next step + coping tool)
- ✅ Daily mood/feeling check-in (simple emoji + text)
- ✅ Text-only interactions
- ✅ Daily reflection prompt
- ✅ Crisis detection & safety routing
- ✅ Privacy controls & data export

**Limitations**:
- ❌ Cannot change age tier after selection
- ❌ No journaling history (single session only)
- ❌ No analytics or trends
- ❌ 5 Flame conversations per day

**Monetization Goal**: Acquisition and activation; demonstrate value to drive upgrades

---

### 4.2 Tier 1: Ryvynn Standard ($9/mo or $90/yr)

**Value Proposition**: Daily support with structure and history

**Includes All Base Features Plus**:
- ✅ Multiple age tier selection (switch anytime)
- ✅ Guided coping modules (structured text-based programs)
  - Examples: "5-Minute Calm," "Worry Tree," "Grounding Sequence"
- ✅ Simple journaling with encryption
  - Save entries, search, tag
  - 30-day retention (auto-delete older)
- ✅ Daily goal setting + reminders
  - Up to 3 daily goals
  - Push notification or email reminders
- ✅ 25 Flame conversations per day

**Key Differentiator**: Persistence and structure for consistent practice

---

### 4.3 Tier 2: Ryvynn Enhanced ($24/mo or $240/yr)

**Value Proposition**: Insights and multimodal support

**Includes All Standard Features Plus**:
- ✅ Mood/behavior analytics
  - Weekly trend summaries (charts + insights)
  - Pattern detection (e.g., "You tend to feel anxious on Mondays")
- ✅ Mini-courses
  - "Resilience Fundamentals" (5 sessions)
  - "Stress Management Toolkit" (7 sessions)
  - "Sleep Hygiene Basics" (3 sessions)
- ✅ Priority response handling
  - Faster server processing (< 1s vs. < 3s)
  - Jump queue during high traffic
- ✅ Voice interaction
  - Text-to-speech Flame responses
  - Gender-appropriate voice
  - Speech-to-text input (Tier 2+)
- ✅ Unlimited journaling (no auto-delete)
- ✅ 75 Flame conversations per day

**Key Differentiator**: Self-awareness through data and convenience through voice

---

### 4.4 Tier 3: Ryvynn Pro ($49/mo or $490/yr)

**Value Proposition**: Integration and automation for busy lives

**Includes All Enhanced Features Plus**:
- ✅ Adaptive behavior modeling
  - Personalized guidance based on patterns
  - "What usually helps you" suggestions
  - Time-of-day awareness
- ✅ Calendar integration
  - Google Calendar / Apple Calendar / Outlook
  - Scheduled check-in reminders
  - Auto-block "self-care time"
- ✅ Wearables & smart reminders
  - Apple Watch / Fitbit / Garmin integration
  - Heart rate variability awareness (when available)
  - Gentle nudges based on activity data
- ✅ API access
  - RESTful API for personal automation
  - Rate limit: 1,000 calls/day
  - Read/write scopes
- ✅ Advanced analytics export (CSV, JSON)
- ✅ Unlimited Flame conversations

**Key Differentiator**: Seamless integration into existing digital life

---

### 4.5 Tier 4: Ryvynn Infinite ($99/mo or $990/yr)

**Value Proposition**: Ultimate customization and predictive insights

**Includes All Pro Features Plus**:
- ✅ Full custom avatar creation
  - Upload/generate custom avatar visuals
  - Personality sliders: warmth, directness, humor, formality
  - Custom name and pronouns
  - Voice cloning or premium voice selection
- ✅ Predictive wellness insights
  - "You may be heading toward burnout based on patterns"
  - Proactive intervention suggestions
  - Risk factor analysis (privacy-safe)
- ✅ Human-AI blended coaching
  - Optional: connect with licensed therapist or certified coach
  - RYVYNN context sharing (with consent)
  - Hybrid support model
- ✅ Concierge support access
  - Priority email/chat support
  - Onboarding call
  - Custom integration assistance
- ✅ White-label options (future: create avatar for team/family)
- ✅ Everything unlimited

**Key Differentiator**: Full personalization and human expertise when needed

---

## Pricing Strategy

### 5.1 Pricing Tiers

| Tier | Monthly | Annual | Savings | Target Audience |
|------|---------|--------|---------|-----------------|
| **Base** | FREE | FREE | — | Curious explorers, students |
| **Standard** | $9 | $90 | 17% | Daily practitioners |
| **Enhanced** | $24 | $240 | 17% | Data-driven users |
| **Pro** | $49 | $490 | 17% | Integrated lifestyles |
| **Infinite** | $99 | $990 | 17% | Power users, professionals |

**Annual Discount Logic**: Roughly 2 months free (16.67% discount)

### 5.2 Optional Add-Ons

Available for purchase regardless of tier:

| Add-On | Price | Description |
|--------|-------|-------------|
| Premium Avatar Visual Pack | $4.99 one-time | High-fidelity avatar visuals (10 options) |
| Premium Voice Pack | $7.99 one-time | Celebrity/professional voice options (5 voices) |
| Analytics Deep Dive Report | $9.99 one-time | 90-day detailed wellness analysis |
| Community Dashboard Access | $14/mo | Share anonymized data with research; see community trends |
| Clinician Dashboard | $29/mo | Share data with therapist (HIPAA-compliant export) |

### 5.3 Upgrade/Downgrade Logic

**Upgrades**: Immediate access to new features; prorated billing
**Downgrades**: Effective at end of current billing cycle; retain access until then
**Cancellation**: Data retained for 90 days (encrypted); then anonymized/deleted

---

## Technical Architecture

### 6.1 System Components

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                 │
│  - Avatar selection UI                          │
│  - Tier upgrade flows                           │
│  - Feature flag checks                          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Server Actions / API Routes             │
│  - Entitlement checks (server-side)             │
│  - Flame response generation                    │
│  - Analytics computation                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            Supabase (Database + Auth)           │
│  - users, subscriptions, entitlements           │
│  - avatar_profiles, preferences                 │
│  - journals, mood_logs, goals, streaks          │
│  - analytics_summaries                          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│               External Services                 │
│  - Stripe (billing)                             │
│  - TTS API (voice, Tier 2+)                     │
│  - Calendar APIs (Tier 3+)                      │
│  - Wearable APIs (Tier 3+)                      │
└─────────────────────────────────────────────────┘
```

### 6.2 Feature Flag System

**Implementation**: Database-driven feature flags with server-side enforcement

```typescript
interface FeatureFlag {
  feature_key: string          // e.g., 'voice_interaction'
  minimum_tier: Tier           // 0-4
  requires_addon?: string      // optional add-on SKU
  enabled: boolean             // global kill switch
}
```

**Check Flow**:
1. User requests feature (e.g., "enable voice")
2. Server checks: `user.current_tier >= feature.minimum_tier`
3. If insufficient tier: return upgrade prompt
4. If sufficient: proceed with feature

### 6.3 Avatar Response Engine

**Input**:
- User message
- Avatar profile (gender persona, age tier)
- User history (tier-dependent)
- User preferences

**Processing**:
1. Crisis detection (all tiers)
2. Emotion detection
3. Context loading (tier-dependent: Tier 3+ loads behavioral patterns)
4. Response generation with persona styling
5. TTS conversion (Tier 2+)

**Output**:
- Text response (reflection + next step + coping tool)
- Audio file URL (Tier 2+)
- Analytics metadata (Tier 2+)

---

## Feature Matrix

### 7.1 Complete Feature Breakdown

| Feature | Base | Standard | Enhanced | Pro | Infinite |
|---------|------|----------|----------|-----|----------|
| **Avatar Selection** |
| Choose gender persona | ✅ | ✅ | ✅ | ✅ | ✅ |
| Choose age tier | ✅ (fixed) | ✅ (switchable) | ✅ | ✅ | ✅ |
| Custom avatar visuals | ❌ | ❌ | ❌ | ❌ | ✅ |
| Custom personality sliders | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Core Interactions** |
| Flame conversations/day | 5 | 25 | 75 | ∞ | ∞ |
| Daily mood check-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily reflection prompt | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crisis detection/routing | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Journaling** |
| Basic journaling | ❌ | ✅ | ✅ | ✅ | ✅ |
| Journal retention | — | 30 days | ∞ | ∞ | ∞ |
| Journal encryption | — | ✅ | ✅ | ✅ | ✅ |
| Tags & search | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Goals & Structure** |
| Daily goal setting | ❌ | ✅ (3 max) | ✅ (10 max) | ✅ (∞) | ✅ (∞) |
| Reminders | ❌ | ✅ | ✅ | ✅ | ✅ |
| Guided coping modules | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mini-courses | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Analytics** |
| Mood tracking | ✅ (current) | ✅ (current) | ✅ (trends) | ✅ (trends) | ✅ (trends) |
| Weekly summaries | ❌ | ❌ | ✅ | ✅ | ✅ |
| Pattern detection | ❌ | ❌ | ✅ | ✅ (enhanced) | ✅ (predictive) |
| Analytics export | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Voice & Audio** |
| Text-to-speech responses | ❌ | ❌ | ✅ | ✅ | ✅ |
| Speech-to-text input | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom voice selection | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Integrations** |
| Calendar sync | ❌ | ❌ | ❌ | ✅ | ✅ |
| Wearable data | ❌ | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Advanced Features** |
| Adaptive modeling | ❌ | ❌ | ❌ | ✅ | ✅ |
| Predictive insights | ❌ | ❌ | ❌ | ❌ | ✅ |
| Human-AI coaching | ❌ | ❌ | ❌ | ❌ | ✅ |
| Concierge support | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Privacy & Control** |
| Data export | ✅ | ✅ | ✅ | ✅ | ✅ |
| Account deletion | ✅ | ✅ | ✅ | ✅ | ✅ |
| Encryption | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## User Flows

### 8.1 Onboarding Flow

**Objective**: Collect minimal data to personalize experience

```
1. Welcome Screen
   "Welcome to RYVYNN. Your privacy-first mental wellness companion."
   [Get Started]

2. Avatar Selection
   "Choose your avatar's gender presentation:"
   [Feminine] [Masculine] [Nonbinary/Custom]

3. Age Tier Selection
   "Select your age range (this helps us personalize guidance):"
   [Youth 13-17] [Young Adult 18-29] [Adult 30-49] [Mature 50+]

4. Name Your Avatar (Optional)
   "What would you like to call your avatar?"
   [Suggested names based on gender] or [Custom name]

5. Privacy Consent
   "RYVYNN encrypts your data and never shares it."
   [✓] I understand RYVYNN is not therapy
   [✓] I'm aware of crisis resources (988)
   [Continue]

6. First Interaction
   Avatar: "Hi, I'm [name]. I'm here to support you. How are you feeling today?"
   [User responds...]
```

**Tier-Specific Onboarding**:
- **Base**: Skip step 4 (cannot customize name)
- **Standard+**: Full flow
- **Infinite**: Add "Customize personality sliders" step

---

### 8.2 Choosing/Changing Avatar

**Base Tier**:
```
Settings > Avatar
"You're currently using [Feminine/Masculine/Nonbinary] avatar."
[Gender cannot be changed on Free tier]
[Upgrade to Standard to switch → ]
```

**Standard+ Tier**:
```
Settings > Avatar
"Current avatar: [Name], [Gender], [Age Tier]"
[Change Gender] → Select new gender → Confirm
[Change Age Tier] → Select new age → Confirm
[Rename Avatar] → Enter new name → Save
```

**Infinite Tier**:
```
Settings > Avatar
[All Standard+ options]
+ [Customize Appearance] → Upload image or generate visual
+ [Personality Tuning] → Sliders: Warmth, Directness, Humor, Formality
+ [Voice Selection] → [Premium voices...] or [Clone my voice]
```

---

### 8.3 Upgrade Flow

**Trigger Points**:
- Hit conversation limit: "You've used 5/5 conversations today. Upgrade to Standard for 25/day."
- Try gated feature: "Voice interaction requires Enhanced tier or higher."
- Proactive prompt: "Based on your usage, Enhanced tier might fit your needs."

**Upgrade UI**:
```
1. Feature Comparison
   [Current Tier] vs. [Target Tier]
   Show: New features, pricing, billing frequency

2. Payment Selection
   ○ Monthly ($X/mo)
   ○ Annual ($Y/yr) — Save $Z!

3. Stripe Checkout
   [Standard Stripe flow]

4. Confirmation
   "Welcome to [Tier]! Your new features are active now."
   [Explore Features]
```

---

### 8.4 Journaling Flow

**Standard Tier**:
```
1. Journal Entry
   App > Journal > [+ New Entry]
   "What's on your mind?"
   [Text input area]
   [Optional: Tag with mood/topic]
   [Save Entry]

2. View Entries
   [List of entries, newest first]
   [Search by keyword]
   [Filter by tag]

3. Encryption Notice
   "Your journal is encrypted. Only you can read it."
```

**Enhanced+ Tier**:
```
[Same as Standard, plus:]
4. Analytics Integration
   "This week, you journaled about [stress] 4 times."
   [View Trends]
```

---

### 8.5 Weekly Report (Enhanced+ Tier)

**Delivery**: Every Sunday at 8 PM user local time

```
Subject: Your RYVYNN Weekly Summary

Hi [User],

Here's how your week went:

Mood Trends
- Most common: Anxious (3 days)
- Improving: Stress levels decreased 15%
- Pattern: You tend to feel better after journaling

Highlights
- 6 Flame conversations
- 4 journal entries
- 2 coping modules completed
- 5-day streak! 🔥

This Week's Insight
"You mentioned 'work deadline' 3 times. Consider scheduling
a 10-minute break when you feel overwhelmed."

Next Week's Focus
Try the "5-Minute Calm" module when stress hits.

[View Full Report in App]
```

**Pro/Infinite Tiers**: Enhanced insights with predictive suggestions

---

### 8.6 Enabling Voice (Enhanced+ Tier)

```
1. Feature Discovery
   App > Settings > Voice Interaction
   "Listen to The Flame's responses instead of reading."
   [Enable Voice]

2. Voice Preview
   "Preview your avatar's voice:"
   [▶ Play Sample]
   "How are you feeling today?"

3. Permissions
   [✓] Allow text-to-speech
   [✓] Allow speech-to-text (optional)
   [Confirm]

4. Usage
   Flame Response Screen:
   [🔊 Listen] button appears
   Click → Play audio response

   Input Screen:
   [🎤 Speak] button appears
   Click → Record → Transcribe → Send
```

---

### 8.7 Enabling Integrations (Pro+ Tier)

**Calendar Integration**:
```
1. App > Settings > Integrations > Calendar
2. "Connect your calendar to schedule self-care time."
3. [Connect Google Calendar] [Connect Apple] [Connect Outlook]
4. OAuth flow → Grant permissions
5. Configure:
   [✓] Daily check-in reminders (9 AM)
   [✓] Auto-block "RYVYNN Time" (30 min/week)
   [ ] Sync goals to calendar
6. [Save]
```

**Wearable Integration**:
```
1. App > Settings > Integrations > Wearables
2. "Sync with your wearable for smarter insights."
3. [Connect Apple Health] [Connect Fitbit] [Connect Garmin]
4. Grant permissions
5. Configure:
   [✓] Heart rate awareness
   [✓] Activity-based nudges
   [ ] Sleep data (coming soon)
6. [Save]
```

---

### 8.8 Exporting Data

**All Tiers**:
```
1. App > Settings > Privacy > Export Data
2. "Download all your RYVYNN data."
3. Select format:
   ○ JSON (complete)
   ○ CSV (analytics only)
4. [Request Export]
5. Email sent: "Your data export is ready."
6. Download link (expires in 7 days)
```

**Pro+ Tiers**: Automated weekly exports option

---

### 8.9 Deleting Account

**All Tiers**:
```
1. App > Settings > Account > Delete Account
2. Warning:
   "This will permanently delete:
   - All journal entries
   - All mood logs and analytics
   - Your avatar and preferences
   - Your account and subscription

   This cannot be undone."
3. [Cancel] [Continue to Delete]
4. Confirmation:
   "Type DELETE to confirm:"
   [Text input]
5. [Delete My Account]
6. Redirect to goodbye page
7. Email confirmation: "Your account has been deleted."
```

**Grace Period**: 90 days to recover (data encrypted, not deleted)

---

## Safety & Privacy

### 9.1 Crisis Detection

**Trigger Keywords** (High Priority):
- "kill myself"
- "end my life"
- "suicide"
- "hurt myself"
- "better off dead"

**Response Flow**:
```
1. Detect keyword → Pause normal response
2. Display crisis banner:
   "If you're thinking about hurting yourself, please reach out now:
   - Call 988 (Suicide & Crisis Lifeline - US)
   - Text "HELLO" to 741741 (Crisis Text Line)
   - Call 911 or your local emergency number

   You deserve support. I'm here, but please talk to someone who can help right now."

3. Offer options:
   [I'm Safe Now] → Resume conversation + gentle check-in
   [I Need Help Now] → Display resources + pause conversation

4. Log event (anonymized):
   - event_type: 'crisis_shown'
   - level: 'high'
   - NO content stored
```

**All Tiers**: Crisis detection always active, never gated

---

### 9.2 Privacy Architecture

**Data Minimization**:
- Collect only what's needed for tier features
- Anonymous identifiers where possible
- Opt-in for advanced analytics

**Encryption**:
- Journal entries: AES-GCM-256 client-side encryption
- Passwords: PBKDF2 key derivation
- At-rest: Supabase encryption
- In-transit: TLS 1.3

**Data Retention**:
- Active users: Indefinite (user-controlled)
- Deleted accounts: 90-day grace period → permanent deletion
- Analytics: Aggregated only, no PII

**Third-Party Sharing**: NEVER (except with user consent for human coaching at Infinite tier)

---

### 9.3 Non-Clinical Disclaimers

**Onboarding**:
```
⚠️ Important: RYVYNN is NOT therapy

RYVYNN provides peer support and wellness tools. It is not a substitute
for professional mental health care, medical advice, or emergency services.

If you are in crisis:
- Call 988 (US) or your local emergency number
- Visit your nearest emergency room
- Contact a licensed therapist or counselor

By continuing, you acknowledge that RYVYNN is a wellness tool, not medical care.
```

**In-App Footer**: "RYVYNN is not therapy. Crisis? Call 988."

---

## Acceptance Criteria

### 10.1 Tier 0: Base (FREE)

| Feature | Acceptance Criteria |
|---------|---------------------|
| Avatar selection | User can choose from 3 gender options; selection persists |
| Age tier selection | User selects age tier; cannot change without upgrade |
| Flame conversations | User can send 5 messages/day; 6th triggers upgrade prompt |
| Daily check-in | User sees daily mood prompt; can select emoji + optional text |
| Crisis detection | "kill myself" triggers crisis banner; resources displayed |
| Data export | User can request full data export; receives download link within 24h |

### 10.2 Tier 1: Standard

| Feature | Acceptance Criteria |
|---------|---------------------|
| Age tier switching | User can change age tier in settings; responses adapt immediately |
| Journaling | User can create, view, search journal entries; 30-day auto-delete works |
| Guided modules | User can access 5+ coping modules; progress saves |
| Daily goals | User can set up to 3 goals; receives reminder notifications |
| Conversation limit | User gets 25 conversations/day; upgrade prompt at limit |

### 10.3 Tier 2: Enhanced

| Feature | Acceptance Criteria |
|---------|---------------------|
| Weekly summary | User receives email every Sunday with mood trends + insights |
| Voice TTS | User clicks [🔊 Listen]; avatar response plays in gender-appropriate voice |
| Voice STT | User clicks [🎤 Speak]; speech transcribes to text correctly |
| Mini-courses | User can enroll in 3+ courses; complete sessions; earn badges |
| Analytics | User sees charts for mood trends over 7/30/90 days |

### 10.4 Tier 3: Pro

| Feature | Acceptance Criteria |
|---------|---------------------|
| Calendar sync | User connects Google Calendar; check-in reminders appear on calendar |
| Wearable sync | User connects Apple Watch; heart rate spikes trigger gentle nudges |
| API access | User generates API key; makes authenticated request; gets valid response |
| Adaptive modeling | Avatar says "Based on your patterns, [suggestion]" with relevant insight |
| Unlimited conversations | User sends 100+ messages in one day; no limit or upgrade prompt |

### 10.5 Tier 4: Infinite

| Feature | Acceptance Criteria |
|---------|---------------------|
| Custom avatar visuals | User uploads image; avatar displays custom visual in app |
| Personality sliders | User adjusts warmth slider; avatar responses reflect change in tone |
| Predictive insights | User receives proactive alert: "You may be heading toward burnout" |
| Human coaching | User books session with therapist; RYVYNN context shared (with consent) |
| Concierge support | User emails support; receives response within 4 business hours |

---

## Implementation Roadmap

### 11.1 Milestones

**Phase 1: Foundation (Weeks 1-3)**
- [ ] Database schema: users, subscriptions, entitlements, avatar_profiles
- [ ] Feature flag system: server-side enforcement
- [ ] Avatar engine: gender persona + age tier selection
- [ ] Basic Flame response styling per avatar
- [ ] Stripe integration: Base → Standard upgrades

**Phase 2: Standard Tier (Weeks 4-6)**
- [ ] Age tier switching logic
- [ ] Journaling: create, view, search, encrypt, 30-day retention
- [ ] Guided coping modules: 5 initial modules
- [ ] Daily goals: set, remind, track
- [ ] Conversation limits: enforce 25/day

**Phase 3: Enhanced Tier (Weeks 7-10)**
- [ ] Analytics engine: mood trends, weekly summaries
- [ ] Mini-courses: 3 initial courses (resilience, stress, sleep)
- [ ] TTS integration: gender-appropriate voice synthesis
- [ ] STT integration: speech-to-text input
- [ ] Email delivery: weekly summary automation

**Phase 4: Pro Tier (Weeks 11-14)**
- [ ] Calendar API integration: Google, Apple, Outlook
- [ ] Wearable API integration: Apple Health, Fitbit
- [ ] API access: authentication, rate limiting, documentation
- [ ] Adaptive modeling: behavioral pattern detection
- [ ] Analytics export: CSV, JSON formats

**Phase 5: Infinite Tier (Weeks 15-18)**
- [ ] Custom avatar builder: upload, generate visuals
- [ ] Personality sliders: warmth, directness, humor, formality
- [ ] Voice cloning/premium voices
- [ ] Predictive insights: burnout detection, proactive alerts
- [ ] Human coaching integration: therapist matching, booking
- [ ] Concierge support: priority queue, onboarding calls

**Phase 6: Polish & Launch (Weeks 19-20)**
- [ ] End-to-end testing: all tiers, all features
- [ ] Performance optimization: caching, CDN, lazy loading
- [ ] Security audit: penetration testing, RLS verification
- [ ] Marketing site: tier comparison, testimonials
- [ ] Launch 🚀

---

### 11.2 Technical Implementation Steps

**Step 1: Database Schema**
```sql
-- See /app/lib/db/schema.sql for full schema
-- Key tables:
- users (extended with avatar preferences)
- subscriptions (Stripe sync)
- entitlements (feature flags per user)
- avatar_profiles (gender, age tier, customizations)
- mood_logs
- journal_entries
- goals
- streaks
- analytics_summaries
```

**Step 2: Feature Flag System**
```typescript
// See /app/lib/features/flags.ts
async function checkFeature(userId: string, featureKey: string): Promise<boolean>
async function requireTier(userId: string, minTier: Tier): Promise<void>
```

**Step 3: Avatar Engine**
```typescript
// See /app/lib/avatar/engine.ts
function generateResponse(input: UserInput, profile: AvatarProfile): FlameResponse
function applyPersonaStyling(response: BaseResponse, persona: GenderPersona): string
function applyAgeTier(response: BaseResponse, ageTier: AgeTier): string
```

**Step 4: Integration Abstractions**
```typescript
// Calendar: /app/lib/integrations/calendar.ts
// Wearables: /app/lib/integrations/wearables.ts
// TTS: /app/lib/integrations/tts.ts
// STT: /app/lib/integrations/stt.ts
```

---

## Assumptions & Decisions

### 12.1 Explicit Assumptions

1. **Age Verification**: Users self-select age tier; no ID verification (privacy trade-off)
2. **Voice Quality**: TTS voices are "good enough" for Tier 2/3; premium/cloned voices for Tier 4
3. **Wearable Data**: Read-only; RYVYNN does not write back to wearable apps
4. **Calendar Integration**: One-way sync (RYVYNN → Calendar); user manages events manually
5. **Human Coaching**: Marketplace model (connect users with therapists); not employed by RYVYNN
6. **API Rate Limits**: 1,000 calls/day for Pro tier (generous for personal use)
7. **Data Retention**: 90-day grace period for deleted accounts (balances recovery + privacy)
8. **Crisis Detection**: Keyword-based (not AI sentiment analysis) for reliability
9. **Localization**: US-focused initially (988 hotline); international expansion requires localized resources
10. **Payment Processing**: Stripe only (not PayPal, crypto, etc.) for simplicity

### 12.2 Key Design Decisions

**Decision**: Gender personas influence style, not quality
**Rationale**: Avoid perception that one gender gets "better" support; all personas equally effective

**Decision**: Age tiers are self-selected
**Rationale**: Privacy over accuracy; users know their context best

**Decision**: Freemium model with generous free tier
**Rationale**: Acquisition over immediate monetization; demonstrate value before asking for payment

**Decision**: Annual discounts are modest (17%)
**Rationale**: Encourage commitment without steep discount expectations; sustainable revenue

**Decision**: Voice is Tier 2+, not Tier 1
**Rationale**: Voice is convenience, not essential; keeps Standard tier affordable

**Decision**: Unlimited conversations at Pro tier
**Rationale**: Users paying $49/mo should not hit artificial limits

**Decision**: Human coaching is Infinite-only
**Rationale**: Liability and cost; premium positioning for hybrid model

**Decision**: No free trial
**Rationale**: Free tier IS the trial; avoid billing surprises

**Decision**: Server-side feature enforcement
**Rationale**: Prevent client-side bypass; ensure tier integrity

**Decision**: Stripe webhooks for real-time entitlement updates
**Rationale**: Immediate feature access/revocation; better UX than polling

---

## Appendix A: Glossary

- **Avatar**: The personalized Flame companion (gender persona + age tier + customizations)
- **The Flame**: Core response engine providing reflection + next step + coping tool
- **Tier**: Pricing/feature level (0=Base, 1=Standard, 2=Enhanced, 3=Pro, 4=Infinite)
- **Persona**: Gender-aligned presentation style (Feminine, Masculine, Nonbinary)
- **Age Tier**: Developmental context (Youth, Young Adult, Adult, Mature)
- **Entitlement**: Server-side record of user's feature access based on subscription
- **Feature Flag**: Per-feature gate requiring minimum tier or add-on
- **Crisis Routing**: Automatic detection and resource display for high-risk keywords
- **Adaptive Modeling**: Tier 3+ feature using historical patterns to personalize guidance
- **Predictive Insights**: Tier 4 feature forecasting wellness trends (e.g., burnout risk)

---

## Appendix B: API Examples

**Check Entitlement**:
```bash
GET /api/entitlements/check?feature=voice_interaction
Authorization: Bearer <user_token>

Response:
{
  "entitled": true,
  "current_tier": 2,
  "required_tier": 2
}
```

**Generate Flame Response**:
```bash
POST /api/flame/respond
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "message": "I'm feeling overwhelmed by work deadlines",
  "include_voice": true
}

Response:
{
  "text": "I hear that work deadlines are weighing on you...",
  "audio_url": "https://cdn.ryvynn.com/tts/abc123.mp3",
  "metadata": {
    "emotion": "overwhelmed",
    "crisis_detected": false
  }
}
```

---

**END OF SPECIFICATION**

This specification is production-ready and provides complete direction for implementation. See accompanying files for data schemas, code stubs, and developer handoff documentation.
