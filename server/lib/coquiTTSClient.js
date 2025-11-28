/**
 * Coqui TTS Client Stub
 * Provides fallback when Coqui TTS is not available
 */

function generateSpeech(text, voice = 'default') {
  console.warn('[Coqui TTS] Service not available');
  return Promise.resolve(null);
}

function isAvailable() {
  return false;
}

module.exports = {
  generateSpeech,
  isAvailable,
};
