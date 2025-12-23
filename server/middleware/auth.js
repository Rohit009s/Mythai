const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware with email verification enforcement
 * Verifies JWT token, checks email verification, and attaches user info to request
 * 
 * CRITICAL: Only verified users can access spiritual guidance
 * This ensures accountability and prevents abuse of emotional/spiritual content
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database to check email verification status
    const { getDb } = require('../db');
    const db = getDb();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { emailVerified: 1, name: 1, age: 1, religion: 1, email: 1 } }
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Please log in again'
      });
    }

    // TRUST LAYER: Enforce email verification for spiritual guidance access
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email verification required',
        message: 'Please verify your email before accessing spiritual guidance. Check your inbox for the verification link.',
        action: 'verify_email'
      });
    }

    // Attach complete user info to request for AI personalization
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      age: user.age,
      religion: user.religion,
      emailVerified: user.emailVerified
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Please provide a valid authentication token'
      });
    }

    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth middleware
 * Attaches user info if token is present, but doesn't require it
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = {
        userId: new ObjectId(decoded.userId),
        email: decoded.email,
        religion: decoded.religion
      };
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
