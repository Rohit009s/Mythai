const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const { getAllReligions } = require('../config/religionMapping');
// Use OTP service for email verification
const { generateOtp, hashOtp, verifyOtp, isOtpExpired, sendOtpEmail, sendPasswordResetOtp } = require('../lib/otpService');
// Use email service for welcome emails
const { sendWelcomeEmail } = require('../lib/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/register
 * Register new user with OTP email verification
 */
router.post('/register', async (req, res) => {
  try {
    const { name, age, gender, email, password, nationality, religion } = req.body;

    // Validation
    if (!name || !email || !password || !religion) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'password', 'religion']
      });
    }

    if (!age || age < 1) {
      return res.status(400).json({ error: 'Age must be greater than 0' });
    }

    if (age < 13) {
      return res.status(400).json({ 
        error: 'Users must be at least 13 years old',
        message: 'For safety reasons, this service requires users to be 13 or older'
      });
    }

    // Validate religion
    const validReligions = getAllReligions().map(r => r.id);
    if (!validReligions.includes(religion)) {
      return res.status(400).json({ 
        error: 'Invalid religion',
        validReligions
      });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'non-binary', 'prefer_not_to_say', 'other'];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({ 
        error: 'Invalid gender',
        validGenders
      });
    }

    const db = getDb();
    const users = db.collection('users');

    // Check if email already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP for email verification
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user with OTP fields
    const newUser = {
      name,
      age: parseInt(age),
      gender: gender || 'prefer_not_to_say',
      email: email.toLowerCase(),
      emailVerified: false,
      passwordHash,
      nationality: nationality || '',
      religion,
      emailOtpHash: otpHash,
      emailOtpExpiry: otpExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newUser);

    // Send OTP email
    console.log(`[Auth] 📧 Sending OTP to ${email.toLowerCase()} for user: ${name}`);
    const emailResult = await sendOtpEmail(email.toLowerCase(), name, otp);
    
    if (!emailResult.success) {
      console.error('[Auth] ❌ Failed to send OTP email:', emailResult.error);
      // Remove user if email failed
      await users.deleteOne({ _id: result.insertedId });
      return res.status(500).json({
        error: 'Failed to send verification code',
        message: 'Please try again or contact support.'
      });
    }

    console.log(`[Auth] ✅ User registered successfully! OTP sent to ${email}`);
    console.log(`[Auth] 👤 User ID: ${result.insertedId}`);
    console.log(`[Auth] 🔐 Check terminal above for OTP code!`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      userId: result.insertedId,
      emailSent: true,
      nextStep: 'verify_otp'
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify email with OTP code
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(`[Auth Debug] OTP verification attempt for ${email} with code ${otp}`);

    if (!email || !otp) {
      return res.status(400).json({ 
        error: 'Email and OTP code required',
        message: 'Please provide both your email and the 6-digit verification code'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        error: 'Invalid OTP format',
        message: 'Verification code must be 6 digits'
      });
    }

    const db = getDb();
    const users = db.collection('users');

    // Find user
    console.log(`[Auth Debug] Looking for user with email: ${email.toLowerCase()}`);
    const user = await users.findOne({ 
      email: email.toLowerCase(),
      emailVerified: false,
      emailOtpHash: { $exists: true }
    });

    console.log(`[Auth Debug] User found:`, user ? 'YES' : 'NO');
    if (user) {
      console.log(`[Auth Debug] User details:`, {
        email: user.email,
        emailVerified: user.emailVerified,
        hasOtpHash: !!user.emailOtpHash,
        otpExpiry: user.emailOtpExpiry,
        currentTime: Date.now()
      });
    }

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found or already verified',
        message: 'Please check your email address or try registering again'
      });
    }

    // Check if OTP is expired
    console.log(`[Auth Debug] Checking OTP expiry...`);
    if (isOtpExpired(user.emailOtpExpiry)) {
      console.log(`[Auth Debug] OTP expired`);
      return res.status(400).json({ 
        error: 'Verification code expired',
        message: 'Please request a new verification code',
        action: 'resend_otp'
      });
    }

    // Verify OTP
    console.log(`[Auth Debug] Verifying OTP...`);
    const otpValid = verifyOtp(otp, user.emailOtpHash);
    console.log(`[Auth Debug] OTP valid:`, otpValid);
    
    if (!otpValid) {
      return res.status(400).json({ 
        error: 'Invalid verification code',
        message: 'Please check the code and try again'
      });
    }

    // Update user - mark as verified and remove OTP fields
    console.log(`[Auth Debug] Updating user verification status...`);
    const result = await users.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: { 
          emailVerified: true,
          updatedAt: new Date()
        },
        $unset: { 
          emailOtpHash: '',
          emailOtpExpiry: ''
        }
      },
      { returnDocument: 'after' }
    );

    console.log(`[Auth Debug] Update result:`, result ? 'SUCCESS' : 'FAILED');
    if (result) {
      console.log(`[Auth Debug] Updated user:`, {
        id: result._id,
        email: result.email,
        emailVerified: result.emailVerified
      });
    }

    if (!result) {
      console.log(`[Auth Debug] Update failed - no result returned`);
      return res.status(500).json({ error: 'Verification failed' });
    }

    // Send welcome email after successful verification
    const welcomeEmailResult = await sendWelcomeEmail(
      result.email, 
      result.name, 
      result.religion
    );
    
    if (!welcomeEmailResult.success) {
      console.warn('[Auth] Failed to send welcome email:', welcomeEmailResult.error);
    }

    console.log(`[Auth] Email verified with OTP for ${result.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to Spirit AI. You can now log in.',
      welcomeEmailSent: welcomeEmailResult.success,
      nextStep: 'login'
    });

  } catch (error) {
    console.error('[Auth] OTP verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP for email verification
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const db = getDb();
    const users = db.collection('users');

    // Find user
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        message: 'You can now log in normally'
      });
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user with new OTP
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          emailOtpHash: otpHash,
          emailOtpExpiry: otpExpiry,
          updatedAt: new Date()
        }
      }
    );

    // Send new OTP email
    const emailResult = await sendOtpEmail(user.email, user.name, otp);
    
    if (!emailResult.success) {
      console.error('[Auth] Failed to resend OTP email:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send verification code',
        message: 'Please try again later or contact support.'
      });
    }

    console.log(`[Auth] OTP resent to ${user.email}`);

    res.json({
      success: true,
      message: 'New verification code sent! Please check your email.',
      emailSent: true
    });

  } catch (error) {
    console.error('[Auth] Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

/**
 * POST /api/auth/login
 * Login and get JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = getDb();
    const users = db.collection('users');

    // Find user
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email before logging in'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT with minimal, safe payload
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        religion: user.religion,
        emailVerified: user.emailVerified
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Update last login
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        nationality: user.nationality,
        religion: user.religion
      }
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires auth)
 */
const { authMiddleware } = require('../middleware/auth');
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Auth middleware should have set req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = getDb();
    const users = db.collection('users');

    const user = await users.findOne(
      { _id: req.user.userId },
      { projection: { passwordHash: 0, verificationToken: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        age: user.age,
        gender: user.gender,
        email: user.email,
        emailVerified: user.emailVerified,
        nationality: user.nationality,
        religion: user.religion,
        dateOfBirth: user.dateOfBirth,
        language: user.language || 'en',
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('[Auth] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires auth)
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, age, gender, nationality, dateOfBirth, religion, language } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (age) {
      if (age < 1) {
        return res.status(400).json({ error: 'Age must be greater than 0' });
      }
      updates.age = parseInt(age);
    }
    if (gender) {
      const validGenders = ['male', 'female', 'non-binary', 'prefer_not_to_say', 'other'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender' });
      }
      updates.gender = gender;
    }
    if (nationality !== undefined) updates.nationality = nationality;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
    if (religion) {
      const validReligions = getAllReligions().map(r => r.id);
      if (!validReligions.includes(religion)) {
        return res.status(400).json({ 
          error: 'Invalid religion',
          validReligions
        });
      }
      updates.religion = religion;
    }
    if (language) {
      const validLanguages = ['en', 'hi', 'te', 'ta', 'kn', 'ml'];
      if (!validLanguages.includes(language)) {
        return res.status(400).json({ 
          error: 'Invalid language',
          validLanguages
        });
      }
      updates.language = language;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.updatedAt = new Date();

    const db = getDb();
    const users = db.collection('users');

    const result = await users.findOneAndUpdate(
      { _id: req.user.userId },
      { $set: updates },
      { returnDocument: 'after', projection: { passwordHash: 0, verificationToken: 0 } }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: result.value._id,
        name: result.value.name,
        email: result.value.email,
        age: result.value.age,
        gender: result.value.gender,
        nationality: result.value.nationality,
        religion: result.value.religion,
        dateOfBirth: result.value.dateOfBirth,
        language: result.value.language || 'en',
        emailVerified: result.value.emailVerified,
        createdAt: result.value.createdAt
      }
    });

  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset OTP
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const db = getDb();
    const users = db.collection('users');

    // Find user
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If this email is registered, you will receive a password reset code.'
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ 
        error: 'Email not verified',
        message: 'Please verify your email first before resetting password'
      });
    }

    // Generate password reset OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user with password reset OTP
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordResetOtpHash: otpHash,
          passwordResetOtpExpiry: otpExpiry,
          updatedAt: new Date()
        }
      }
    );

    // Send password reset OTP email
    const emailResult = await sendPasswordResetOtp(user.email, user.name, otp);
    
    if (!emailResult.success) {
      console.error('[Auth] Failed to send password reset OTP:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send reset code',
        message: 'Please try again later or contact support.'
      });
    }

    console.log(`[Auth] Password reset OTP sent to ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset code sent to your email.',
      emailSent: true,
      nextStep: 'verify_reset_otp'
    });

  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/auth/verify-reset-otp
 * Verify password reset OTP
 */
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        error: 'Email and OTP code required',
        message: 'Please provide both your email and the 6-digit reset code'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        error: 'Invalid OTP format',
        message: 'Reset code must be 6 digits'
      });
    }

    const db = getDb();
    const users = db.collection('users');

    // Find user
    const user = await users.findOne({ 
      email: email.toLowerCase(),
      passwordResetOtpHash: { $exists: true }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Invalid reset request',
        message: 'Please request a new password reset code'
      });
    }

    // Check if OTP is expired
    if (isOtpExpired(user.passwordResetOtpExpiry)) {
      return res.status(400).json({ 
        error: 'Reset code expired',
        message: 'Please request a new password reset code',
        action: 'request_new_reset'
      });
    }

    // Verify OTP
    if (!verifyOtp(otp, user.passwordResetOtpHash)) {
      return res.status(400).json({ 
        error: 'Invalid reset code',
        message: 'Please check the code and try again'
      });
    }

    // Generate temporary reset token (valid for 15 minutes)
    const resetToken = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Remove OTP fields and add reset token
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordResetToken: resetToken,
          passwordResetTokenExpiry: Date.now() + 15 * 60 * 1000, // 15 minutes
          updatedAt: new Date()
        },
        $unset: { 
          passwordResetOtpHash: '',
          passwordResetOtpExpiry: ''
        }
      }
    );

    console.log(`[Auth] Password reset OTP verified for ${user.email}`);

    res.json({
      success: true,
      message: 'Reset code verified! You can now set a new password.',
      resetToken,
      nextStep: 'reset_password'
    });

  } catch (error) {
    console.error('[Auth] Reset OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify reset code' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Legacy endpoint - redirects to resend-otp for backward compatibility
 */
router.post('/resend-verification', (req, res) => {
  // Forward to the new OTP endpoint
  req.url = '/api/auth/resend-otp';
  router.handle(req, res);
});

/**
 * GET /api/auth/verify-email
 * Legacy token-based verification (kept for backward compatibility)
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        error: 'Verification token required',
        message: 'This verification method is deprecated. Please use OTP verification instead.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'email-verification') {
      return res.status(400).json({ error: 'Invalid token purpose' });
    }

    const db = getDb();
    const users = db.collection('users');

    // Update user
    const result = await users.findOneAndUpdate(
      { email: decoded.email, verificationToken: token },
      { 
        $set: { 
          emailVerified: true,
          updatedAt: new Date()
        },
        $unset: { verificationToken: '' }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ 
        error: 'User not found or token already used',
        message: 'Please try registering again with OTP verification'
      });
    }

    // Send welcome email after successful verification
    const welcomeEmailResult = await sendWelcomeEmail(
      result.value.email, 
      result.value.name, 
      result.value.religion
    );
    
    if (!welcomeEmailResult.success) {
      console.warn('[Auth] Failed to send welcome email:', welcomeEmailResult.error);
    }

    console.log(`[Auth] Email verified via legacy token for ${result.value.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to Spirit AI. You can now log in.',
      welcomeEmailSent: welcomeEmailResult.success,
      note: 'This verification method is deprecated. Future verifications will use OTP codes.'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        error: 'Verification token expired',
        message: 'Please register again to receive a new OTP verification code'
      });
    }
    console.error('[Auth] Legacy email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

/**
 * GET /api/auth/religions
 * Get list of supported religions
 */
router.get('/religions', (req, res) => {
  res.json({
    success: true,
    religions: getAllReligions()
  });
});

/**
 * POST /api/auth/test-email
 * Test hybrid email service (tries Gmail, falls back to mock)
 */
router.post('/test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test endpoint not available in production' });
  }

  try {
    const { testEmailService } = require('../lib/hybridEmailService');
    const result = await testEmailService();
    
    res.json({
      success: result.success,
      message: result.message,
      service: result.service,
      messageId: result.messageId,
      note: result.note,
      error: result.error
    });
  } catch (error) {
    console.error('[Auth] Email test error:', error);
    res.status(500).json({ error: 'Email test failed', details: error.message });
  }
});

module.exports = router;

/**
 * POST /api/auth/reset-password
 * Reset password with verified token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ 
        error: 'Reset token and new password required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long'
      });
    }

    // Verify reset token
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const db = getDb();
    const users = db.collection('users');

    // Find user and verify token
    const user = await users.findOne({ 
      _id: new ObjectId(decoded.userId),
      passwordResetToken: resetToken
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Invalid or expired reset token',
        message: 'Please request a new password reset'
      });
    }

    // Check token expiry
    if (Date.now() > user.passwordResetTokenExpiry) {
      return res.status(400).json({ 
        error: 'Reset token expired',
        message: 'Please request a new password reset'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and remove reset fields
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash,
          updatedAt: new Date()
        },
        $unset: { 
          passwordResetToken: '',
          passwordResetTokenExpiry: ''
        }
      }
    );

    console.log(`[Auth] Password reset completed for ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      nextStep: 'login'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        error: 'Reset token expired',
        message: 'Please request a new password reset'
      });
    }
    console.error('[Auth] Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});