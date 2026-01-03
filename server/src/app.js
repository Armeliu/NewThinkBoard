import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './features/auth/authRoutes.js';
import aiRoutes from './features/ai/aiRoutes.js';
import authMiddleware from './middleware/auth.js';
import matchRoutes from './features/matches/matchRoutes.js';
import roomRoutes from './features/rooms/roomRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(pinoHttp());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/rooms', roomRoutes);

app.use(errorHandler);

export default app;
