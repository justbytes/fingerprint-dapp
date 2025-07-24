// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { formatTimestamp } from '../utils/helpers';

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

/**
 * Middleware to validate API key authentication
 */
export const validateApiKey = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get API key from headers
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    // Get expected API key from environment
    const expectedApiKey = process.env.API_SECRET_KEY;

    // Check if API key is configured
    if (!expectedApiKey) {
      console.error('❌ API_SECRET_KEY not configured in environment variables');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        timestamp: formatTimestamp(),
      });
      return;
    }

    // Check if API key is provided
    if (!apiKey) {
      console.log('❌ No API key provided in request');
      res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'Please provide a valid API key in the X-API-Key header',
        timestamp: formatTimestamp(),
      });
      return;
    }

    // Validate API key
    if (apiKey !== expectedApiKey) {
      // Log unauthorized access attempt (but don't log the actual key)
      console.warn(`🚨 Unauthorized API access attempt from ${req.ip} at ${formatTimestamp()}`);
      console.log('❌ Keys do not match!');

      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is not valid',
        timestamp: formatTimestamp(),
      });
      return;
    }

    // Mark request as authenticated
    req.isAuthenticated = true;

    // Log successful authentication in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Authenticated request from ${req.ip} to ${req.method} ${req.path}`);
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      timestamp: formatTimestamp(),
    });
  }
};
