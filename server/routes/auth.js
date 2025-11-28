const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { getAllReligions } = require('../config/religionMapping');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/register
 * Register new user with email verification
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

    // Generate email verification token
    const verificationToken = jwt.sign(
      { email: email.toLowerCase(), purpose: 'email-verification' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create user
    const newUser = {
      name,
      age: parseInt(age),
      gender: gender || 'prefer_not_to_say',
      email: email.toLowerCase(),
      emailVerified: false,
      passwordHash,
      nationality: nationality || '',
      religion,
      verificationToken,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newUser);

    // In production, send email here
    console.log(`[Auth] Verification link: /api/auth/verify-email?token=${verificationToken}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      userId: result.insertedId,
      verificationToken // Remove in production, send via email instead
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
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
      return res.status(404).json({ error: 'User not found or token already used' });
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Verification token expired' });
    }
    console.error('[Auth] Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
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

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        religion: user.religion
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

    const { name, age, gender, nationality } = req.body;
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
      user: result.value
    });

  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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

module.exports = router;
