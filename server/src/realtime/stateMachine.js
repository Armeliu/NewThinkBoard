export const phases = {
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  IN_QUESTION: 'IN_QUESTION',
  SHOW_RESULTS: 'SHOW_RESULTS',
  NEXT_QUESTION: 'NEXT_QUESTION',
  FINISHED: 'FINISHED',
};

const transitions = {
  [phases.LOBBY]: [phases.COUNTDOWN],
  [phases.COUNTDOWN]: [phases.IN_QUESTION],
  [phases.IN_QUESTION]: [phases.SHOW_RESULTS],
  [phases.SHOW_RESULTS]: [phases.NEXT_QUESTION, phases.FINISHED],
  [phases.NEXT_QUESTION]: [phases.IN_QUESTION],
  [phases.FINISHED]: [],
};

export const canTransition = (from, to) => {
  return transitions[from]?.includes(to);
};

export const nextPhase = ({ phase, questionIndex, totalQuestions }) => {
  if (phase === phases.SHOW_RESULTS && questionIndex >= totalQuestions - 1) {
    return phases.FINISHED;
  }

  switch (phase) {
    case phases.LOBBY:
      return phases.COUNTDOWN;
    case phases.COUNTDOWN:
      return phases.IN_QUESTION;
    case phases.IN_QUESTION:
      return phases.SHOW_RESULTS;
    case phases.SHOW_RESULTS:
      return phases.NEXT_QUESTION;
    case phases.NEXT_QUESTION:
      return phases.IN_QUESTION;
    default:
      return phases.FINISHED;
  }
};
