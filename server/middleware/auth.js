const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
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

    // Attach user info to request
    req.user = {
      userId: new ObjectId(decoded.userId),
      email: decoded.email,
      religion: decoded.religion
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
