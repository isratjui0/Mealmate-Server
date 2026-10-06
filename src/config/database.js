import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let mongod = null;

export const connectDB = async () => {
  let uri = env.MONGODB_URI;

  // In test environment, always use memory server for isolated test runs
  if (env.NODE_ENV === 'test') {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      logger.info('Started MongoDB Memory Server for test execution');
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to start MongoMemoryServer for tests, trying default URI');
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    // If local development and connection failed, auto-fallback to embedded memory server
    if (env.NODE_ENV === 'development') {
      logger.warn(
        { err: primaryErr.message },
        'Could not connect to external MongoDB URI. Starting automatic embedded MongoDB instance...'
      );
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        const fallbackUri = mongod.getUri();
        const conn = await mongoose.connect(fallbackUri);
        logger.info(`Embedded MongoDB Memory Server connected: ${conn.connection.host}`);
        return conn;
      } catch (fallbackErr) {
        logger.error({ err: fallbackErr.message }, 'Failed to start fallback embedded MongoDB');
        throw primaryErr;
      }
    }
    logger.error({ err: primaryErr.message }, 'MongoDB connection failure');
    throw primaryErr;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    logger.info('MongoDB connection closed gracefully');
  } catch (err) {
    logger.error({ err: err.message }, 'Error closing MongoDB connection');
  }
};
