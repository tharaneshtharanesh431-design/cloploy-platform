import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB connected on: ${env.MONGODB_URI}`);
  } catch (error) {
    if (env.MONGODB_URI.includes(':3122')) {
      const fallbackUri = env.MONGODB_URI.replace(':3122', ':27017');
      logger.warn(`MongoDB connection on port 3122 failed. Attempting fallback on port 27017...`);
      try {
        await mongoose.connect(fallbackUri);
        logger.info(`MongoDB successfully connected on fallback port: ${fallbackUri}`);
        return;
      } catch (fallbackError) {
        logger.error(`Fallback connection on port 27017 also failed: ${fallbackError.message}`);
      }
    }
    throw error;
  }
}
