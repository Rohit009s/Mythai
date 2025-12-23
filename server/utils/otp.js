/**
 * OTP utility functions
 * Matches the structure from your guide
 */

const crypto = require('crypto');

/**
 * Generate secure 6-digit OTP
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 */
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Verify OTP against stored hash
 */
function verifyOtp(otp, storedHash) {
  const otpHash = hashOtp(otp);
  return otpHash === storedHash;
}

/**
 * Check if OTP is expired
 */
function isOtpExpired(expiryTime) {
  return Date.now() > expiryTime;
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  isOtpExpired
};