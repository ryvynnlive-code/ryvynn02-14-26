/**
 * The Flame Response Engine
 * Deterministic rule-based system for mental wellness support
 *
 * CRITICAL REQUIREMENTS:
 * - 4th-5th grade reading level
 * - No poetic or metaphorical language
 * - Non-clinical, peer support tone
 * - Crisis detection and safety routing
 * - No therapy claims
 */

export interface FlameInput {
  userMessage: string
  userId: string
}

export interface FlameResponse {
  reflection: string
  nextStep: string
  copingTool: string
  isCrisis: boolean
  crisisLevel?: 'low' | 'medium' | 'high'
}

// Crisis detection keywords
const CRISIS_KEYWORDS = {
  high: [
    'kill myself',
    'end my life',
    'suicide',
    'want to die',
    'better off dead',
    'end it all',
    'no reason to live',
    'hurt myself',
    'take my life',
  ],
  medium: [
    'self harm',
    'cut myself',
    'harm myself',
    'hate myself',
    'worthless',
    'hopeless',
    'no point',
    'give up',
  ],
  low: [
    'depressed',
    'anxious',
    'scared',
    'alone',
    'sad',
    'worried',
    'stressed',
  ],
}

// Emotion detection patterns
const EMOTION_PATTERNS = {
  anxious: ['anxious', 'worried', 'nervous', 'scared', 'panic', 'afraid'],
  sad: ['sad', 'down', 'depressed', 'lonely', 'empty', 'numb'],
  angry: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'rage'],
  overwhelmed: ['overwhelmed', 'too much', 'can\'t handle', 'breaking down'],
  stressed: ['stressed', 'pressure', 'tense', 'strained'],
  lonely: ['lonely', 'alone', 'isolated', 'nobody', 'abandoned'],
}

// Coping tools database
const COPING_TOOLS = {
  anxious: [
    'Try the 5-4-3-2-1 method: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.',
    'Take 3 slow deep breaths. Breathe in for 4 counts, hold for 4, breathe out for 4.',
    'Put your hand on your chest and feel it go up and down as you breathe. This can help you feel calmer.',
  ],
  sad: [
    'Do one small thing you used to enjoy, even if you don\'t feel like it right now.',
    'Write down 3 things you\'re grateful for today, even if they\'re small.',
    'Reach out to one person you trust and let them know you\'re having a hard time.',
  ],
  angry: [
    'Take a break and step away from what\'s making you angry for 5 minutes.',
    'Write down what you\'re feeling without stopping or thinking about it. Then throw it away or keep it.',
    'Do something physical like a quick walk or jumping jacks to release the energy.',
  ],
  overwhelmed: [
    'Pick just one small task to do right now. Just one. Everything else can wait.',
    'Make a simple list of what you need to do, then cross off anything that can wait.',
    'Set a timer for 5 minutes and just rest. Close your eyes or look out a window.',
  ],
  stressed: [
    'Tense all your muscles for 5 seconds, then release them. Notice how your body feels.',
    'Listen to one song you like and focus only on the music.',
    'Drink a glass of water slowly. Pay attention to how it feels.',
  ],
  lonely: [
    'Text or call one person, even just to say hi.',
    'Go somewhere with other people, even if you don\'t talk to them. A coffee shop or library can help.',
    'Remember: feeling alone doesn\'t mean you are alone. This feeling will pass.',
  ],
  general: [
    'Take a 5-minute break to do something different.',
    'Drink some water and notice how you feel.',
    'Name what you\'re feeling out loud or write it down.',
  ],
}

/**
 * Detect crisis level in user message
 */
export function detectCrisisLevel(message: string): {
  isCrisis: boolean
  level?: 'low' | 'medium' | 'high'
} {
  const lowerMessage = message.toLowerCase()

  // Check high-level crisis keywords first
  for (const keyword of CRISIS_KEYWORDS.high) {
    if (lowerMessage.includes(keyword)) {
      return { isCrisis: true, level: 'high' }
    }
  }

  // Check medium-level keywords
  for (const keyword of CRISIS_KEYWORDS.medium) {
    if (lowerMessage.includes(keyword)) {
      return { isCrisis: true, level: 'medium' }
    }
  }

  return { isCrisis: false }
}

/**
 * Detect primary emotion in user message
 */
function detectEmotion(message: string): keyof typeof EMOTION_PATTERNS | 'general' {
  const lowerMessage = message.toLowerCase()

  for (const [emotion, keywords] of Object.entries(EMOTION_PATTERNS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return emotion as keyof typeof EMOTION_PATTERNS
      }
    }
  }

  return 'general'
}

/**
 * Generate reflection (what I hear you saying)
 */
function generateReflection(message: string, emotion: string): string {
  const reflections = {
    anxious: [
      'It sounds like you\'re feeling worried and things feel uncertain right now.',
      'I hear that you\'re feeling anxious and it\'s making things hard.',
      'It seems like worry is taking up a lot of space in your mind right now.',
    ],
    sad: [
      'I hear that you\'re feeling down and things feel heavy right now.',
      'It sounds like you\'re going through a tough time and feeling sad.',
      'I can tell you\'re feeling low and it\'s hard to see the light right now.',
    ],
    angry: [
      'I hear that you\'re feeling frustrated and maybe things aren\'t fair.',
      'It sounds like you\'re angry about what\'s happening.',
      'I can tell something has made you feel really mad or upset.',
    ],
    overwhelmed: [
      'It sounds like you have too much on your plate right now.',
      'I hear that everything feels like too much to handle.',
      'It seems like you\'re dealing with a lot all at once.',
    ],
    stressed: [
      'I hear that you\'re under a lot of pressure right now.',
      'It sounds like stress is weighing on you.',
      'I can tell you\'re feeling stretched thin.',
    ],
    lonely: [
      'I hear that you\'re feeling alone right now.',
      'It sounds like you\'re missing connection with others.',
      'I can tell you\'re feeling isolated and it hurts.',
    ],
    general: [
      'I hear that you\'re going through something difficult.',
      'It sounds like you\'re dealing with a challenge right now.',
      'I can tell things aren\'t easy for you at the moment.',
    ],
  }

  const options = reflections[emotion as keyof typeof reflections] || reflections.general
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Generate next step (actionable guidance)
 */
function generateNextStep(emotion: string): string {
  const nextSteps = {
    anxious: [
      'Take a moment to slow down your breathing and ground yourself in the present.',
      'Try to identify one specific worry and write it down.',
      'Remember that you\'ve felt anxious before and you got through it.',
    ],
    sad: [
      'Do one small thing that used to make you feel a little better.',
      'Be kind to yourself. This feeling won\'t last forever.',
      'Reach out to someone you trust and let them know you\'re struggling.',
    ],
    angry: [
      'Give yourself permission to step away and cool down before acting.',
      'Name what made you angry without judging yourself for feeling this way.',
      'Find a healthy way to release this energy, like moving your body.',
    ],
    overwhelmed: [
      'Break things down into the smallest possible steps.',
      'Focus on just the next 5 minutes, not everything at once.',
      'Ask for help with one thing. You don\'t have to do it all alone.',
    ],
    stressed: [
      'Take a real break, even if it\'s just 5 minutes.',
      'Check in with your body. Are you tense? Hungry? Tired?',
      'Let go of one thing that can wait until tomorrow.',
    ],
    lonely: [
      'Reach out to someone, even with a simple message.',
      'Remember people who care about you, even if they\'re not here right now.',
      'Be somewhere around others, even if you don\'t interact.',
    ],
    general: [
      'Take a small step toward taking care of yourself.',
      'Notice what you need right now and try to give yourself that.',
      'Remember that you\'re doing the best you can.',
    ],
  }

  const options = nextSteps[emotion as keyof typeof nextSteps] || nextSteps.general
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Select a coping tool based on emotion
 */
function selectCopingTool(emotion: string): string {
  const tools = COPING_TOOLS[emotion as keyof typeof COPING_TOOLS] || COPING_TOOLS.general
  return tools[Math.floor(Math.random() * tools.length)]
}

/**
 * Generate Flame response (deterministic engine)
 */
export function generateFlameResponse(input: FlameInput): FlameResponse {
  const { userMessage } = input

  // Check for crisis
  const { isCrisis, level } = detectCrisisLevel(userMessage)

  // Detect primary emotion
  const emotion = detectEmotion(userMessage)

  // Generate response components
  const reflection = generateReflection(userMessage, emotion)
  const nextStep = generateNextStep(emotion)
  const copingTool = selectCopingTool(emotion)

  return {
    reflection,
    nextStep,
    copingTool,
    isCrisis,
    crisisLevel: level,
  }
}

/**
 * Get crisis safety message based on level
 */
export function getCrisisSafetyMessage(level: 'low' | 'medium' | 'high'): string {
  if (level === 'high') {
    return 'If you are thinking about hurting yourself or ending your life, please reach out for help right now. Call 988 (Suicide and Crisis Lifeline) in the US, or your local emergency number. You can also text "HELLO" to 741741 (Crisis Text Line). You deserve support.'
  }

  if (level === 'medium') {
    return 'It sounds like you might be thinking about harming yourself. Please talk to someone who can help. You can call 988 in the US or your local crisis line. You don\'t have to go through this alone.'
  }

  return 'If you need immediate help, call 988 (US) or your local crisis line. There are people ready to support you.'
}
