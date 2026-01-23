/**
 * Text-to-Speech Integration (Tier 2+)
 * Supports multiple TTS providers: ElevenLabs, OpenAI, Google
 */

import { createClient } from '@/lib/supabase/server'

export interface TTSRequest {
  text: string
  voice_id?: string
  gender_persona: 'feminine' | 'masculine' | 'nonbinary'
}

export interface TTSResponse {
  audio_url: string
  provider: string
  duration_ms?: number
}

/**
 * Generate speech from text
 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  const provider = process.env.TTS_PROVIDER || 'elevenlabs'

  switch (provider) {
    case 'elevenlabs':
      return await generateElevenLabs(request)
    case 'openai':
      return await generateOpenAI(request)
    case 'google':
      return await generateGoogle(request)
    default:
      throw new Error(`Unsupported TTS provider: ${provider}`)
  }
}

/**
 * ElevenLabs TTS Implementation
 */
async function generateElevenLabs(request: TTSRequest): Promise<TTSResponse> {
  const voiceId = request.voice_id || getDefaultVoiceId(request.gender_persona)

  if (!process.env.TTS_API_KEY) {
    throw new Error('TTS_API_KEY not configured')
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': process.env.TTS_API_KEY,
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
    throw new Error(`ElevenLabs TTS failed: ${response.statusText}`)
  }

  // Upload to Supabase Storage
  const audioBuffer = await response.arrayBuffer()
  const fileName = `tts/${Date.now()}-${voiceId}.mp3`

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('audio').upload(fileName, audioBuffer, {
    contentType: 'audio/mpeg',
    cacheControl: '3600',
  })

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('audio').getPublicUrl(fileName)

  return {
    audio_url: publicUrl,
    provider: 'elevenlabs',
  }
}

/**
 * OpenAI TTS Implementation
 */
async function generateOpenAI(request: TTSRequest): Promise<TTSResponse> {
  if (!process.env.TTS_API_KEY) {
    throw new Error('TTS_API_KEY (OpenAI) not configured')
  }

  const voiceMap: Record<string, string> = {
    feminine: 'nova',
    masculine: 'onyx',
    nonbinary: 'alloy',
  }

  const voice = voiceMap[request.gender_persona] || 'alloy'

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TTS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: request.text,
      voice,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI TTS failed: ${response.statusText}`)
  }

  // Upload to Supabase Storage
  const audioBuffer = await response.arrayBuffer()
  const fileName = `tts/${Date.now()}-openai.mp3`

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('audio').upload(fileName, audioBuffer, {
    contentType: 'audio/mpeg',
  })

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('audio').getPublicUrl(fileName)

  return {
    audio_url: publicUrl,
    provider: 'openai',
  }
}

/**
 * Google Cloud TTS Implementation
 */
async function generateGoogle(request: TTSRequest): Promise<TTSResponse> {
  // Implement Google Cloud Text-to-Speech
  // See: https://cloud.google.com/text-to-speech/docs

  throw new Error('Google TTS not yet implemented')
}

/**
 * Get default voice ID based on gender persona
 */
function getDefaultVoiceId(persona: string): string {
  const voiceMap: Record<string, string> = {
    feminine: process.env.TTS_VOICE_FEMININE || 'EXAVITQu4vr4xnSDxMaL', // ElevenLabs default
    masculine: process.env.TTS_VOICE_MASCULINE || 'VR6AewLTigWG4xSOukaG',
    nonbinary: process.env.TTS_VOICE_NONBINARY || 'pNInz6obpgDQGcFmaJgB',
  }

  return voiceMap[persona] || voiceMap.feminine
}
