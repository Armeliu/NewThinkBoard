import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import Match from '../../db/models/Match.js';
import { judgeEssay } from './ollamaJudge.js';

const router = express.Router();

router.post('/regrade', authMiddleware, async (req, res, next) => {
  try {
    const matches = await Match.find({ 'results.awarded.status': 'PENDING_AI' });
    let updated = 0;

    for (const match of matches) {
      for (const result of match.results) {
        for (const award of result.awarded) {
          if (award.status !== 'PENDING_AI') continue;
          const question = match.questions[result.questionIndex];
          if (!question || question.type !== 'ESSAY') continue;
          const submission = match.submissions.find(
            (sub) => sub.questionIndex === result.questionIndex &&
              sub.userId.toString() === award.userId.toString()
          );
          if (!submission) continue;

          const judged = await judgeEssay({
            prompt: question.prompt,
            answer: submission.answer,
            pointsCorrect: question.pointsCorrect,
            rubric: question.rubric,
          });

          if (judged.status === 'SCORED') {
            award.status = 'SCORED';
            award.points = judged.result.score;
            award.rubric = judged.result;
            updated += 1;
          }
        }
      }
      await match.save();
    }

    res.json({ ok: true, updated });
  } catch (error) {
    next(error);
  }
});

export default router;
