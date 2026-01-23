/**
 * Avatar Profile Type Definitions
 * Maps to /data/avatar_profiles.json structure
 */

export type GenderPersonaId = 'feminine' | 'masculine' | 'nonbinary'
export type AgeTierId = 'youth' | 'young_adult' | 'adult' | 'mature'

export interface AvatarProfile {
  id: string
  user_id: string

  // Core Settings
  gender_persona: GenderPersonaId
  age_tier: AgeTierId
  avatar_name: string

  // Tier 4: Custom Settings
  custom_visual_url?: string
  personality_warmth?: number // 1-10
  personality_directness?: number // 1-10
  personality_humor?: number // 1-10
  personality_formality?: number // 1-10

  // Voice Settings (Tier 2+)
  voice_enabled: boolean
  voice_id?: string

  // Metadata
  created_at: string
  updated_at: string
}

export interface GenderPersona {
  id: GenderPersonaId
  name: string
  default_names: string[]
  description: string
  language_style: {
    tone: string
    approach: string
    emphasis: string
  }
  example_scenarios: string[]
  response_patterns: {
    greeting: string
    reflection_prefix: string
    validation_style: string
    encouragement: string
  }
  voice_profile: {
    pitch: string
    pace: string
    warmth: string
    style: string
  }
}

export interface AgeTier {
  id: AgeTierId
  name: string
  age_range: string
  description: string
  context_focus: string[]
  language_adjustments: {
    reading_level: string
    vocabulary: string
    examples: string
    references: string
  }
  safety_enhancements: {
    crisis_detection_sensitivity: string
    parental_notification_option?: boolean
    resource_emphasis: string
  }
  content_guidelines: {
    avoid: string[]
    emphasize: string[]
    tone: string
  }
  example_prompts: {
    check_in: string
    coping_tool: string
    next_step: string
  }
}

export interface ResponseTemplate {
  reflection: {
    feminine: string
    masculine: string
    nonbinary: string
  }
  next_step: {
    feminine: string
    masculine: string
    nonbinary: string
  }
  coping_tool: {
    general: string
    youth: string
    young_adult: string
    adult: string
    mature: string
  }
}

export interface CopingModule {
  id: string
  name: string
  description: string
  duration_minutes: number
  steps: string[]
  available_tiers: number[] // [1, 2, 3, 4]
}

export interface MiniCourse {
  id: string
  name: string
  description: string
  sessions: number
  duration_per_session_minutes: number
  topics: string[]
  available_tiers: number[] // [2, 3, 4]
}

export interface CrisisKeywords {
  high_priority: string[]
  medium_priority: string[]
  youth_specific: string[]
}

export interface AvatarProfileData {
  gender_personas: GenderPersona[]
  age_tiers: AgeTier[]
  response_templates: ResponseTemplate
  crisis_keywords: CrisisKeywords
  coping_modules: CopingModule[]
  mini_courses: MiniCourse[]
}
