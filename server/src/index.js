import http from 'node:http';
import app from './app.js';
import env from './config/env.js';
import connectToDatabase from './db/connect.js';
import createSocketServer from './realtime/socket.js';

const startServer = async () => {
  try {
    await connectToDatabase();
    const server = http.createServer(app);
    createSocketServer(server, env.clientOrigin);

    server.listen(env.port, () => {
      console.log(`QuizDuel API running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
