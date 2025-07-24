// server/routes/health.ts
import { Router, Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { formatTimestamp } from '../utils/helpers';
import { HealthCheckResponse } from '../types';

const router = Router();

/**
 * GET /health - Health check endpoint
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    // Basic health check data
    const healthData: HealthCheckResponse = {
      success: true,
      status: 'healthy',
      timestamp: formatTimestamp(),
      uptime: process.uptime(),
    };

    // Test database connection
    try {
      const db = getDatabase();
      await db.get('SELECT 1 as test');

      // Add database status to response
      const response = {
        ...healthData,
        database: {
          status: 'connected',
          type: 'SQLite',
        },
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      };

      res.json(response);
    } catch (dbError) {
      // Database connection failed
      const response = {
        ...healthData,
        status: 'degraded',
        database: {
          status: 'disconnected',
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      };

      res.status(503).json(response);
    }
  } catch (error) {
    console.error('Health check error:', error);

    res.status(500).json({
      success: false,
      status: 'unhealthy',
      timestamp: formatTimestamp(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
});

export default router;
