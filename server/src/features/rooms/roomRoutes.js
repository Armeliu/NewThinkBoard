import express from 'express';
import { z } from 'zod';
import authMiddleware from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { createRoom, joinRoom } from './roomService.js';

const router = express.Router();

const createSchema = z.object({ body: z.object({}) });
const joinSchema = z.object({ body: z.object({ code: z.string().length(5) }) });

router.post('/create', authMiddleware, validate(createSchema), async (req, res, next) => {
  try {
    const room = await createRoom(req.user.userId);
    return res.status(201).json({ ok: true, roomCode: room.code });
  } catch (error) {
    return next(error);
  }
});

router.post('/join', authMiddleware, validate(joinSchema), async (req, res, next) => {
  try {
    const { room, error } = await joinRoom(req.validated.body.code, req.user.userId);
    if (error) {
      return res.status(400).json({ ok: false, message: error });
    }
    return res.json({ ok: true, roomCode: room.code });
  } catch (error) {
    return next(error);
  }
});

export default router;
