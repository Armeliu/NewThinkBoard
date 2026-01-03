import { describe, it, expect } from 'vitest';
import { getPointsForDifficulty, getNegativePoints, scoreMcq } from '../src/utils/scoring.js';

describe('scoring', () => {
  it('returns points for difficulty', () => {
    expect(getPointsForDifficulty('EASY')).toBe(40);
    expect(getPointsForDifficulty('MEDIUM')).toBe(70);
    expect(getPointsForDifficulty('HARD')).toBe(100);
  });

  it('returns negative marking points', () => {
    expect(getNegativePoints('EASY')).toBe(-10);
    expect(getNegativePoints('MEDIUM')).toBe(-18);
    expect(getNegativePoints('HARD')).toBe(-25);
  });

  it('scores MCQ correctly', () => {
    expect(scoreMcq({ isCorrect: true, difficulty: 'EASY', negativeMarking: true })).toBe(40);
    expect(scoreMcq({ isCorrect: false, difficulty: 'EASY', negativeMarking: true })).toBe(-10);
    expect(scoreMcq({ isCorrect: false, difficulty: 'EASY', negativeMarking: false })).toBe(0);
  });
});
