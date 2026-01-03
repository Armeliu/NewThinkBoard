import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import validate from '../../middleware/validate.js';
import { registerUser, loginUser } from './authService.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6).max(100),
  }),
});

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6).max(100),
  }),
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validated.body;
    const result = await registerUser({ username, password });
    if (result.error) {
      return res.status(409).json({ ok: false, message: result.error });
    }

    return res.status(201).json({
      ok: true,
      token: result.token,
      user: { id: result.user._id.toString(), username: result.user.username },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validated.body;
    const result = await loginUser({ username, password });
    if (result.error) {
      return res.status(401).json({ ok: false, message: result.error });
    }

    return res.json({
      ok: true,
      token: result.token,
      user: { id: result.user._id.toString(), username: result.user.username },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
