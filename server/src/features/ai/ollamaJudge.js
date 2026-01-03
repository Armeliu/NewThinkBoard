import { z } from 'zod';
import env from '../../config/env.js';

const responseSchema = z.object({
  score: z.number().min(0),
  rubricBreakdown: z.object({
    accuracy: z.number().min(0),
    completeness: z.number().min(0),
    clarity: z.number().min(0),
  }),
  shortJustification: z.string().max(360),
  confidence: z.enum(['low', 'medium', 'high']),
});

const buildPrompt = ({ prompt, answer, pointsCorrect, rubric }) => `You are a strict grader. Output JSON only. No markdown. No explanations.

Question prompt:
${prompt}

Student answer:
${answer}

Rubric guidance:
${JSON.stringify(rubric)}

Return JSON with fields: score (0-${pointsCorrect}), rubricBreakdown {accuracy, completeness, clarity} scaled to ${pointsCorrect} (accuracy 40%, completeness 40%, clarity 20%), shortJustification <= 60 words, confidence (low|medium|high).
`;

export const judgeEssay = async ({ prompt, answer, pointsCorrect, rubric }) => {
  if (env.aiJudge !== 'ollama') {
    return { status: 'PENDING_AI' };
  }

  const response = await fetch(`${env.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      prompt: buildPrompt({ prompt, answer, pointsCorrect, rubric }),
      stream: false,
    }),
  });

  if (!response.ok) {
    return { status: 'PENDING_AI' };
  }

  const data = await response.json();
  const raw = data.response?.trim();
  if (!raw) {
    return { status: 'PENDING_AI' };
  }

  try {
    const parsed = JSON.parse(raw);
    const validated = responseSchema.parse(parsed);
    return { status: 'SCORED', result: validated };
  } catch (error) {
    return { status: 'PENDING_AI' };
  }
};
