/**
 * Avatar Response Engine
 * Generates Flame responses with gender persona and age tier styling
 */

import { AvatarProfile, GenderPersona, AgeTier, CopingModule } from '@/types/avatars'
import avatarProfilesData from '@/data/avatar_profiles.json'
import { detectCrisisLevel, getCrisisSafetyMessage } from '@/lib/flame/engine'

export interface FlameInput {
  message: string
  user_id: string
  include_voice?: boolean
}

export interface FlameResponse {
  text: string
  emotion?: string
  is_crisis: boolean
  crisis_level?: 'low' | 'medium' | 'high'
  audio_url?: string
  metadata?: Record<string, any>
}

/**
 * Generate Flame response with avatar persona styling
 */
export function generateAvatarResponse(
  input: FlameInput,
  profile: AvatarProfile,
  userHistory?: any
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

  // 3. Load persona and age tier data
  const personaData = loadGenderPersona(profile.gender_persona)
  const ageTierData = loadAgeTier(profile.age_tier)

  // 4. Generate base response components
  const baseResponse = generateBaseResponse(primaryEmotion, input.message, userHistory)

  // 5. Apply persona styling
  const reflection = applyPersonaStyling(
    baseResponse.reflection,
    personaData,
    primaryEmotion,
    'reflection'
  )

  const nextStep = applyAgeTierContext(baseResponse.next_step, ageTierData)

  const copingTool = selectCopingTool(primaryEmotion, ageTierData)

  // 6. Combine response
  let finalText = `${reflection}\n\n${nextStep}\n\n${copingTool}`

  // 7. Apply custom personality (Tier 4 only)
  if (
    profile.personality_warmth ||
    profile.personality_directness ||
    profile.personality_humor ||
    profile.personality_formality
  ) {
    finalText = applyPersonalitySliders(finalText, profile)
  }

  return {
    text: finalText,
    emotion: primaryEmotion,
    is_crisis: false,
    metadata: {
      persona: profile.gender_persona,
      age_tier: profile.age_tier,
      avatar_name: profile.avatar_name,
    },
  }
}

/**
 * Apply gender persona language patterns
 */
function applyPersonaStyling(
  text: string,
  persona: GenderPersona,
  emotion: string,
  type: 'reflection' | 'next_step'
): string {
  const patterns = persona.response_patterns

  if (type === 'reflection') {
    // Use persona-specific reflection prefix
    return `${patterns.reflection_prefix.replace('...', emotion)}. ${patterns.validation_style}`
  }

  return text
}

/**
 * Apply age tier context and examples
 */
function applyAgeTierContext(text: string, ageTier: AgeTier): string {
  // Replace generic examples with age-appropriate ones
  const examples = ageTier.language_adjustments.examples

  // Simple replacement for demonstration
  // In production, use more sophisticated NLP matching
  text = text.replace(/work/gi, examples.split(',')[0])

  return text
}

/**
 * Select appropriate coping tool based on emotion and age tier
 */
function selectCopingTool(emotion: string, ageTier: AgeTier): string {
  const modules = avatarProfilesData.coping_modules

  // Filter by available_tiers
  const ageTierNumber = ageTierToNumber(ageTier.id)
  const available = modules.filter((m: CopingModule) =>
    m.available_tiers.includes(ageTierNumber)
  )

  // Select based on emotion (simplified - in production use better matching)
  let selected: CopingModule

  if (emotion === 'anxious' || emotion === 'overwhelmed') {
    selected = available.find((m) => m.id === 'grounding_sequence') || available[0]
  } else if (emotion === 'sad' || emotion === 'hopeless') {
    selected = available.find((m) => m.id === 'thought_reframe') || available[0]
  } else {
    selected = available.find((m) => m.id === '5_min_calm') || available[0]
  }

  return formatCopingModule(selected, ageTier)
}

/**
 * Apply custom personality sliders (Tier 4 only)
 */
function applyPersonalitySliders(text: string, profile: AvatarProfile): string {
  let adjusted = text

  // Warmth (1-10, default 5)
  if (profile.personality_warmth && profile.personality_warmth > 6) {
    // Add warmth cues
    adjusted = adjusted.replace(/\. /g, '. 💙 ')
    adjusted = adjusted.replace(/you/g, 'you, friend')
  } else if (profile.personality_warmth && profile.personality_warmth < 4) {
    // Reduce warmth
    adjusted = adjusted.replace(/friend/g, '')
    adjusted = adjusted.replace(/💙/g, '')
  }

  // Directness (1-10, default 5)
  if (profile.personality_directness && profile.personality_directness > 7) {
    // More direct language
    adjusted = adjusted.replace(/you might/g, 'you should')
    adjusted = adjusted.replace(/consider/g, 'do')
    adjusted = adjusted.replace(/try/g, 'do this')
  } else if (profile.personality_directness && profile.personality_directness < 4) {
    // Softer language
    adjusted = adjusted.replace(/should/g, 'might want to')
    adjusted = adjusted.replace(/do this/g, 'consider trying')
  }

  // Humor (1-10, default 5)
  if (profile.personality_humor && profile.personality_humor > 6) {
    // Add light humor (context-appropriate)
    // In production, use more sophisticated humor injection
    adjusted = adjusted.replace(/breathe/g, 'breathe (yes, that thing we forget to do!)')
  }

  // Formality (1-10, default 5)
  if (profile.personality_formality && profile.personality_formality > 7) {
    // More formal language
    adjusted = adjusted.replace(/you're/g, 'you are')
    adjusted = adjusted.replace(/can't/g, 'cannot')
  } else if (profile.personality_formality && profile.personality_formality < 4) {
    // More casual
    adjusted = adjusted.replace(/you are/g, "you're")
    adjusted = adjusted.replace(/cannot/g, "can't")
  }

  return adjusted
}

// ============================================
// Helper Functions
// ============================================

function loadGenderPersona(id: string): GenderPersona {
  const persona = avatarProfilesData.gender_personas.find((p) => p.id === id) ||
    avatarProfilesData.gender_personas[0]
  return persona as GenderPersona
}

function loadAgeTier(id: string): AgeTier {
  const ageTier = avatarProfilesData.age_tiers.find((a) => a.id === id) || avatarProfilesData.age_tiers[0]
  return ageTier as AgeTier
}

function ageTierToNumber(id: string): number {
  const map: Record<string, number> = {
    youth: 1,
    young_adult: 2,
    adult: 3,
    mature: 4,
  }
  return map[id] || 2
}

function detectEmotion(message: string): string {
  // Simple keyword-based emotion detection
  // In production, use more sophisticated sentiment analysis

  const lowerMessage = message.toLowerCase()

  if (
    lowerMessage.includes('anxious') ||
    lowerMessage.includes('worried') ||
    lowerMessage.includes('nervous')
  ) {
    return 'anxious'
  }

  if (
    lowerMessage.includes('sad') ||
    lowerMessage.includes('depressed') ||
    lowerMessage.includes('down')
  ) {
    return 'sad'
  }

  if (
    lowerMessage.includes('angry') ||
    lowerMessage.includes('frustrated') ||
    lowerMessage.includes('mad')
  ) {
    return 'angry'
  }

  if (
    lowerMessage.includes('overwhelmed') ||
    lowerMessage.includes('stressed') ||
    lowerMessage.includes('too much')
  ) {
    return 'overwhelmed'
  }

  if (lowerMessage.includes('lonely') || lowerMessage.includes('alone')) {
    return 'lonely'
  }

  return 'uncertain' // default
}

function generateBaseResponse(
  emotion: string,
  message: string,
  userHistory?: any
): {
  reflection: string
  next_step: string
  coping_tool: string
} {
  // Base response generation (adapted from existing Flame engine)

  const reflections: Record<string, string> = {
    anxious: "you're feeling anxious and uncertain",
    sad: "you're feeling down or sad",
    angry: "you're feeling frustrated or angry",
    overwhelmed: "things feel like too much right now",
    lonely: "you're feeling disconnected or alone",
    uncertain: "you're working through something difficult",
  }

  const nextSteps: Record<string, string> = {
    anxious: 'One thing you could try: Take a 5-minute break and do the grounding exercise below.',
    sad: 'One thing you could try: Write down three small things that went okay today.',
    angry:
      'One thing you could try: Take a brief walk or do some physical movement to release that energy.',
    overwhelmed:
      'One thing you could try: Pick just one small task to focus on right now. The rest can wait.',
    lonely: 'One thing you could try: Reach out to one person, even just to say hello.',
    uncertain: 'One thing you could try: Take it one step at a time. What feels right to do next?',
  }

  return {
    reflection: reflections[emotion] || reflections.uncertain,
    next_step: nextSteps[emotion] || nextSteps.uncertain,
    coping_tool: '', // Will be filled by selectCopingTool
  }
}

function formatCopingModule(module: CopingModule, ageTier: AgeTier): string {
  const agePrompt = ageTier.example_prompts.coping_tool

  return `**${module.name}** (${module.duration_minutes} min):\n${module.steps
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n')}\n\n${agePrompt}`
}
