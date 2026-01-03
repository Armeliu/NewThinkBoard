import mongoose from 'mongoose';
import env from '../config/env.js';

const connectToDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
};

export default connectToDatabase;
