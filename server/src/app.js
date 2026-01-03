import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use(pinoHttp());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use(errorHandler);

export default app;
