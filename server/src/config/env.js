import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export default env;
