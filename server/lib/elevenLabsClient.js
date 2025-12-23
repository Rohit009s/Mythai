const axios = require('axios');
const path = require('path');
const fs = require('fs');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVY5Cd5';
const BASE_URL = 'https://api.elevenlabs.io/v1';

// Demo mode: return null if no API key
const DEMO_MODE = !API_KEY;

// Load voice configuration with character-specific voice IDs
let voiceConfig = {};
try {
  const voiceConfigPath = path.join(__dirname, '../../data/voices/voice-ids.json');
  if (fs.existsSync(voiceConfigPath)) {
    voiceConfig = JSON.parse(fs.readFileSync(voiceConfigPath, 'utf8'));
    console.log('[ElevenLabs] Loaded character voice configuration with', Object.keys(voiceConfig.characters).length, 'characters');
  }
} catch (error) {
  console.warn('[ElevenLabs] Failed to load voice config:', error.message);
}

/**
 * Get voice ID for a specific character/persona
 * @param {string} character - Character name (e.g., 'krishna', 'shiva', 'rama')
 * @returns {string} ElevenLabs voice ID
 */
function getCharacterVoiceId(character) {
  if (!character) return voiceConfig.default_voice?.elevenlabs_voice_id || VOICE_ID;
  
  const characterLower = character.toLowerCase();
  const characterVoice = voiceConfig.characters?.[characterLower];
  
  if (characterVoice) {
    console.log(`[ElevenLabs] Using voice ID for ${character}: ${characterVoice.elevenlabs_voice_id}`);
    return characterVoice.elevenlabs_voice_id;
  }
  
  return voiceConfig.default_voice?.elevenlabs_voice_id || VOICE_ID;
}

/**
 * Get voice settings for a specific character with emotional parameters
 * @param {string} character - Character name
 * @param {object} emotionalParams - Emotional parameters {tone, narration}
 * @returns {object} Voice settings (stability, similarity_boost, speed)
 */
function getCharacterVoiceSettings(character, emotionalParams = null) {
  // Start with base character settings
  let settings;
  if (!character) {
    settings = voiceConfig.voice_settings || { stability: 0.65, similarity_boost: 0.75, speed: 1.0 };
  } else {
    const characterLower = character.toLowerCase();
    const characterVoice = voiceConfig.characters?.[characterLower];
    
    if (characterVoice) {
      settings = {
        stability: characterVoice.stability || 0.65,
        similarity_boost: characterVoice.similarity_boost || 0.75,
        speed: characterVoice.speed || 1.0,
      };
    } else {
      settings = voiceConfig.voice_settings || { stability: 0.65, similarity_boost: 0.75, speed: 1.0 };
    }
  }
  
  // Apply emotional adjustments if provided
  if (emotionalParams && emotionalParams.tone && emotionalParams.narration) {
    settings = applyEmotionalAdjustments(settings, emotionalParams.tone, emotionalParams.narration);
    console.log(`[ElevenLabs] Applied emotional adjustments: ${emotionalParams.tone}/${emotionalParams.narration}`);
  }
  
  return settings;
}

/**
 * Apply emotional adjustments to voice settings
 */
function applyEmotionalAdjustments(baseSettings, tone, narration) {
  const settings = { ...baseSettings };
  
  // Adjust based on tone (emotion category)
  switch (tone) {
    case 'compassionate':
      settings.stability = Math.min(settings.stability + 0.2, 1.0);      // More stable, gentle
      settings.similarity_boost = Math.min(settings.similarity_boost + 0.1, 1.0); // Warmer
      break;
      
    case 'humorous':
      settings.stability = Math.max(settings.stability - 0.25, 0.1);     // Less stable for playfulness
      settings.similarity_boost = Math.max(settings.similarity_boost - 0.1, 0.1); // More variation
      break;
      
    case 'firm':
      settings.stability = Math.min(settings.stability + 0.25, 1.0);     // Very stable for authority
      settings.similarity_boost = Math.min(settings.similarity_boost + 0.15, 1.0); // Consistent
      break;
      
    case 'joyful':
      settings.stability = Math.max(settings.stability - 0.15, 0.1);     // Lighter, more varied
      settings.similarity_boost = settings.similarity_boost;             // Keep similarity
      break;
      
    case 'sorrowful':
      settings.stability = Math.min(settings.stability + 0.3, 1.0);      // Very stable for solemnity
      settings.similarity_boost = Math.min(settings.similarity_boost + 0.1, 1.0); // Consistent
      break;
      
    case 'motivational':
      settings.stability = Math.max(settings.stability - 0.1, 0.1);      // Slightly less stable for energy
      settings.similarity_boost = settings.similarity_boost;             // Keep similarity
      break;
      
    case 'reflective':
      settings.stability = Math.min(settings.stability + 0.15, 1.0);     // More stable for wisdom
      settings.similarity_boost = Math.min(settings.similarity_boost + 0.05, 1.0); // Slightly warmer
      break;
      
    case 'calm':
    default:
      // No adjustments for calm/default
      break;
  }
  
  // Fine-tune based on narration style
  switch (narration) {
    case 'slow':
      settings.stability = Math.min(settings.stability + 0.1, 1.0);      // More stable
      settings.speed = Math.max((settings.speed || 1.0) - 0.1, 0.5);    // Slower
      break;
      
    case 'playful':
      settings.stability = Math.max(settings.stability - 0.15, 0.1);     // Less stable
      break;
      
    case 'serious':
      settings.stability = Math.min(settings.stability + 0.1, 1.0);      // More stable
      break;
      
    case 'warm':
      settings.similarity_boost = Math.min(settings.similarity_boost + 0.05, 1.0); // Warmer
      break;
      
    case 'solemn':
      settings.stability = Math.min(settings.stability + 0.15, 1.0);     // Very stable
      settings.speed = Math.max((settings.speed || 1.0) - 0.05, 0.7);   // Slightly slower
      break;
      
    case 'neutral':
    default:
      // No additional adjustments
      break;
  }
  
  return settings;
}

/**
 * Generate speech from text using ElevenLabs API with character-specific voice and emotional parameters
 * Returns URL to audio file or null in demo mode
 * @param {string} text - Text to synthesize (use tts_text from emotional response)
 * @param {string} character - Character/persona name (e.g., 'krishna', 'shiva')
 * @param {object} emotionalParams - Emotional parameters {tone, narration} from LLM
 * @param {object} options - Additional options (voiceId, language, etc.)
 */
async function generateSpeech(text, character = null, emotionalParams = null, options = {}) {
  // Get character-specific voice ID
  const voiceId = options.voiceId || getCharacterVoiceId(character);
  const voiceSettings = getCharacterVoiceSettings(character, emotionalParams);
  
  if (DEMO_MODE) {
    const characterName = character ? ` (${character})` : '';
    const emotionInfo = emotionalParams ? ` [${emotionalParams.tone}/${emotionalParams.narration}]` : '';
    console.log(`[ElevenLabs] Demo mode${characterName}${emotionInfo} - returning mock audio URL with voice ID: ${voiceId}`);
    return null; // In production, would store in S3 or return presigned URL
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
        },
      },
      {
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // In production, save to S3 or storage service
    // For now, return base64 encoded or presigned URL
    const base64 = Buffer.from(response.data).toString('base64');
    
    const emotionInfo = emotionalParams ? ` [${emotionalParams.tone}/${emotionalParams.narration}]` : '';
    console.log(`[ElevenLabs] Generated speech for ${character || 'unknown'}${emotionInfo} with voice ID ${voiceId}`);
    console.log(`[ElevenLabs] Voice settings: stability=${voiceSettings.stability}, similarity=${voiceSettings.similarity_boost}`);
    
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error(`[ElevenLabs] TTS failed for ${character || 'unknown'} with voice ID ${voiceId}:`, 
      error.response?.status, error.response?.data || error.message);
    return null;
  }
}

/**
 * Get available voices from ElevenLabs
 */
async function getVoices() {
  if (DEMO_MODE) {
    console.log('[ElevenLabs] Demo mode - returning mock voices');
    return [
      { voice_id: 'JBFqnCBsd6RMkjVY5Cd5', name: 'Giovanni (M)', preview_url: null },
      { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (F)', preview_url: null },
      { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Antoni (M)', preview_url: null },
    ];
  }

  try {
    const response = await axios.get(`${BASE_URL}/voices`, {
      headers: {
        'xi-api-key': API_KEY,
      },
    });
    return response.data.voices || [];
  } catch (error) {
    console.error('[ElevenLabs] Failed to fetch voices:', error.message);
    return [];
  }
}

/**
 * Get character voice configuration
 * @param {string} character - Character name
 * @returns {object} Character voice configuration
 */
function getCharacterConfig(character) {
  if (!character) return voiceConfig.default_voice || {};
  
  const characterLower = character.toLowerCase();
  return voiceConfig.characters?.[characterLower] || voiceConfig.default_voice || {};
}

/**
 * List all available characters and their voice IDs
 * @returns {object} Mapping of all characters to their voice IDs
 */
function listCharacterVoices() {
  const result = {};
  if (voiceConfig.characters) {
    Object.entries(voiceConfig.characters).forEach(([key, value]) => {
      result[key] = {
        name: value.name,
        voice_id: value.elevenlabs_voice_id,
        tone: value.tone,
        style: value.style,
      };
    });
  }
  return result;
}

module.exports = {
  generateSpeech,
  getVoices,
  getCharacterVoiceId,
  getCharacterVoiceSettings,
  getCharacterConfig,
  listCharacterVoices,
  DEMO_MODE,
  voiceConfig,
};
