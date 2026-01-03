import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  aiJudge: process.env.AI_JUDGE || 'disabled',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
};

export default env;
