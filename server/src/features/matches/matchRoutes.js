import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import Match from '../../db/models/Match.js';

const router = express.Router();

router.get('/:matchId', authMiddleware, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ ok: false, message: 'Match not found' });
    }
    return res.json({ ok: true, match });
  } catch (error) {
    return next(error);
  }
});

export default router;
