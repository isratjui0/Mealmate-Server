import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { startScheduler, stopScheduler } from './services/scheduler.service.js';
import { logger } from './utils/logger.js';

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(env.PORT, () => {
      logger.info(`MealMate Backend Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API Health endpoint: http://localhost:${env.PORT}/api/health`);
      logger.info(`Swagger API Documentation: http://localhost:${env.PORT}/api/docs`);
    });

    // Start background job scheduler
    startScheduler();

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} signal received: initiating graceful shutdown...`);
      stopScheduler();

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await disconnectDB();
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }

      // Force shutdown after 10s if hanging
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err: err.message }, 'Failed to bootstrap MealMate server');
    process.exit(1);
  }
};

startServer();
