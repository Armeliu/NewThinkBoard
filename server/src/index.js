import app from './app.js';
import env from './config/env.js';
import connectToDatabase from './db/connect.js';

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(env.port, () => {
      console.log(`QuizDuel API running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
