import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { getUserById } from '../services/database.js';

/**
 * Authentication middleware
 * Validates JWT token and adds user info to request object
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No authorization header provided' 
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User not found' 
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Token expired' 
      });
    }

    res.status(500).json({ 
      error: 'Authentication error', 
      message: 'Internal server error during authentication' 
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await getUserById(decoded.id);
    if (user) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }

    next();

  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires specific role(s) to access the route
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access forbidden', 
        message: `Requires one of the following roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 * Shorthand for authorize('admin')
 */
const adminOnly = authorize('admin');

/**
 * Developer or admin middleware
 * Allows both developers and admins
 */
const developerOrAdmin = authorize('developer', 'admin');

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Validate API key middleware (for external integrations)
 */
const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required', 
        message: 'Please provide X-API-Key header' 
      });
    }

    // In production, validate against database
    // For now, check against environment variable
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ 
        error: 'Invalid API key', 
        message: 'The provided API key is not valid' 
      });
    }

    next();

  } catch (error) {
    console.error('API Key Validation Error:', error);
    res.status(500).json({ 
      error: 'API key validation error', 
      message: 'Internal server error during API key validation' 
    });
  }
};

export {
  auth,
  optionalAuth,
  authorize,
  adminOnly,
  developerOrAdmin,
  authRateLimit,
  validateApiKey
};