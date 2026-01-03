export const difficultyPoints = {
  EASY: 40,
  MEDIUM: 70,
  HARD: 100,
};

export const negativePoints = {
  EASY: -10,
  MEDIUM: -18,
  HARD: -25,
};

export const getPointsForDifficulty = (difficulty) => {
  return difficultyPoints[difficulty] || 0;
};

export const getNegativePoints = (difficulty) => {
  return negativePoints[difficulty] || 0;
};

export const scoreMcq = ({ isCorrect, difficulty, negativeMarking }) => {
  const pointsCorrect = getPointsForDifficulty(difficulty);
  const pointsWrong = negativeMarking ? getNegativePoints(difficulty) : 0;

  if (isCorrect) {
    return pointsCorrect;
  }

  return pointsWrong;
};
