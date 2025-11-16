const axios = require('axios');

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVY5Cd5';
const BASE_URL = 'https://api.elevenlabs.io/v1';

// Demo mode: return null if no API key
const DEMO_MODE = !API_KEY;

/**
 * Generate speech from text using ElevenLabs API
 * Returns URL to audio file or null in demo mode
 */
async function generateSpeech(text, voiceId = VOICE_ID) {
  if (DEMO_MODE) {
    console.log('[ElevenLabs] Demo mode - returning mock audio URL');
    return null; // In production, would store in S3 or return presigned URL
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
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
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error('[ElevenLabs] TTS failed:', error.response?.status, error.response?.data || error.message);
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

module.exports = {
  generateSpeech,
  getVoices,
  DEMO_MODE,
};
