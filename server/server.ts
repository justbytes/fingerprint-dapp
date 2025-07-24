// server/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { initializeDatabase, closeDatabase } from './config/database';
import { validateEnvironment, createErrorResponse, formatTimestamp } from './utils/helpers';
import fingerprintsRoutes from './routes/fingerprints';
import healthRoutes from './routes/health';
import { DatabaseError, ValidationError, NotFoundError } from './types';
import { generalLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();

// Validate environment and get config
const config = validateEnvironment();

// Middleware
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// Request logging middleware (development only)
if (config.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = formatTimestamp();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts:
      config.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false, // Disable HSTS in development
  })
);

// Rate limit 50 requests per 15 minutes
app.use(generalLimiter);

// Routes
app.use('/', healthRoutes); // Health routes: /health
app.use('/', fingerprintsRoutes); // Fingerprint routes: /log, /fingerprints, /fingerprints/:hash

// 404 handler - must come after all routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: formatTimestamp(),
  });
});

// Global error handler - must be last
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: config.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: formatTimestamp(),
  });

  // Handle specific error types
  if (error instanceof ValidationError) {
    res.status(400).json(createErrorResponse(error));
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json(createErrorResponse(error));
    return;
  }

  if (error instanceof DatabaseError) {
    res.status(500).json(createErrorResponse(error));
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
    });
    return;
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: config.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: formatTimestamp(),
  });
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  try {
    await closeDatabase();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }

  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Web3 Tracker Backend...');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}`);

    // Initialize database
    await initializeDatabase();

    // Start HTTP server
    const server = app.listen(config.PORT, () => {
      console.log('✅ Server started successfully!');
      console.log(`🔗 Server running on: http://localhost:${config.PORT}`);
      console.log(`❤️  Health check: http://localhost:${config.PORT}/health`);
      console.log('');
      console.log('📡 Available endpoints:');
      console.log('  POST /log                    - Log fingerprint data');
      console.log('  GET  /fingerprints           - Get all fingerprints');
      console.log('  GET  /fingerprints/:hash     - Get fingerprint by hash');
      console.log('  GET  /health                 - Health check');
      console.log('');
      console.log('🎯 Ready to receive requests!');
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down HTTP server...');
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    console.error('💥 Server startup failed:', error);
    process.exit(1);
  });
}

export default app;
