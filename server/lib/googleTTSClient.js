/**
 * Google TTS Client Stub
 * Provides fallback when Google TTS is not available
 */

function generateSpeech(text, voice = 'default') {
  console.warn('[Google TTS] Service not available');
  return Promise.resolve(null);
}

function isAvailable() {
  return false;
}

module.exports = {
  generateSpeech,
  isAvailable,
};
