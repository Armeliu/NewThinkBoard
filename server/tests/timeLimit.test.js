import { describe, it, expect } from 'vitest';
import { calculateTimeLimitSeconds } from '../src/utils/timeLimit.js';

describe('time limits', () => {
  it('uses base values', () => {
    expect(calculateTimeLimitSeconds({ type: 'MCQ', difficulty: 'EASY', prompt: 'short' })).toBe(20);
    expect(calculateTimeLimitSeconds({ type: 'ESSAY', difficulty: 'MEDIUM', prompt: 'short' })).toBe(90);
  });

  it('adds length adjustments and caps', () => {
    const longPrompt = 'a'.repeat(450);
    expect(calculateTimeLimitSeconds({ type: 'ESSAY', difficulty: 'HARD', prompt: longPrompt })).toBe(130);
    const veryLongPrompt = 'a'.repeat(1000);
    expect(calculateTimeLimitSeconds({ type: 'ESSAY', difficulty: 'HARD', prompt: veryLongPrompt })).toBe(130);
  });
});
