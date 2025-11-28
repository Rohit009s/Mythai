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
 * Get voice settings for a specific character
 * @param {string} character - Character name
 * @returns {object} Voice settings (stability, similarity_boost, speed)
 */
function getCharacterVoiceSettings(character) {
  if (!character) return voiceConfig.voice_settings || {};
  
  const characterLower = character.toLowerCase();
  const characterVoice = voiceConfig.characters?.[characterLower];
  
  if (characterVoice) {
    return {
      stability: characterVoice.stability || 0.65,
      similarity_boost: characterVoice.similarity_boost || 0.75,
      speed: characterVoice.speed || 1.0,
    };
  }
  
  return voiceConfig.voice_settings || { stability: 0.65, similarity_boost: 0.75, speed: 1.0 };
}

/**
 * Generate speech from text using ElevenLabs API with character-specific voice
 * Returns URL to audio file or null in demo mode
 * @param {string} text - Text to synthesize
 * @param {string} character - Character/persona name (e.g., 'krishna', 'shiva')
 * @param {object} options - Additional options (voiceId, language, etc.)
 */
async function generateSpeech(text, character = null, options = {}) {
  // Get character-specific voice ID
  const voiceId = options.voiceId || getCharacterVoiceId(character);
  const voiceSettings = getCharacterVoiceSettings(character);
  
  if (DEMO_MODE) {
    const characterName = character ? ` (${character})` : '';
    console.log(`[ElevenLabs] Demo mode${characterName} - returning mock audio URL with voice ID: ${voiceId}`);
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
    console.log(`[ElevenLabs] Generated speech for ${character || 'unknown'} with voice ID ${voiceId}`);
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
