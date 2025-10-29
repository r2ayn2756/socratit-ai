// ============================================================================
// SERVER ENTRY POINT
// Starts the Express server and connects to database and Redis (optional)
// ============================================================================

import http from 'http';
import app from './app';
import { env, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { disconnectRedis, getStorageType } from './config/redis';
import { initializeWebSocket } from './services/websocket.service';
import { cleanupStalePresence } from './services/presence.service';
import { initializeVelocityCron } from './jobs/velocity.cron';
import { startCurriculumCleanupJob } from './jobs/curriculum.cron';
import { scheduleAIInsightsCron } from './jobs/aiInsights.cron';
import { startFileProcessingJob } from './jobs/fileProcessing.cron';

// Validate environment variables
validateEnv();

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Redis will connect automatically if enabled (handled in redis.ts)
    // No need to explicitly test connection here

    // Create HTTP server (needed for WebSocket integration)
    const httpServer = http.createServer(app);

    // Initialize WebSocket server
    initializeWebSocket(httpServer);

    // Start HTTP server
    httpServer.listen(env.PORT, () => {
      console.log('');
      console.log('========================================');
      console.log(`🚀 Socratit.ai Backend Server`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Server running on port ${env.PORT}`);
      console.log(`📡 API: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
      console.log(`💚 Health: http://localhost:${env.PORT}/health`);
      console.log(`⚡ WebSocket: ws://localhost:${env.PORT}`);
      console.log(`💾 Storage: ${getStorageType().toUpperCase()}`);
      console.log('========================================');
      console.log('');
    });

    // Periodic cleanup of stale presence records (every 5 minutes)
    setInterval(() => {
      cleanupStalePresence().catch((error) => {
        console.error('[PRESENCE CLEANUP ERROR]', error);
      });
    }, 5 * 60 * 1000); // 5 minutes

    // Initialize cron jobs
    initializeVelocityCron();
    startCurriculumCleanupJob();
    scheduleAIInsightsCron();
    startFileProcessingJob();

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      // Close server
      httpServer.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          // Disconnect from database
          await disconnectDatabase();

          // Disconnect from Redis
          await disconnectRedis();

          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      console.error('❌ Unhandled Rejection:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
