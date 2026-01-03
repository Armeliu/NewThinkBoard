import { describe, it, expect } from 'vitest';
import { phases, canTransition, nextPhase } from '../src/realtime/stateMachine.js';

describe('state machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition(phases.LOBBY, phases.COUNTDOWN)).toBe(true);
    expect(canTransition(phases.COUNTDOWN, phases.IN_QUESTION)).toBe(true);
    expect(canTransition(phases.IN_QUESTION, phases.SHOW_RESULTS)).toBe(true);
  });

  it('moves to finished after last question', () => {
    const phase = nextPhase({
      phase: phases.SHOW_RESULTS,
      questionIndex: 9,
      totalQuestions: 10,
    });
    expect(phase).toBe(phases.FINISHED);
  });
});
