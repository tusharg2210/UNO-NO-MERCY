import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const connectDB = async () => {
  try {
    const { connect, connection } = mongoose;
    const conn = await connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    connection.on('error', (err) => {
      logger.error(`MongoDB Error: ${err.message}`);
    });

    connection.on('disconnected', () => {
      logger.warn('MongoDB Disconnected. Attempting reconnection...');
    });

    connection.on('reconnected', () => {
      logger.info('MongoDB Reconnected');
    });

  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;