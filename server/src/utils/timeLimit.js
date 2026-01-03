const baseTime = {
  MCQ: {
    EASY: 20,
    MEDIUM: 30,
    HARD: 40,
  },
  ESSAY: {
    EASY: 60,
    MEDIUM: 90,
    HARD: 120,
  },
};

export const calculateTimeLimitSeconds = ({ type, difficulty, prompt }) => {
  const base = baseTime[type]?.[difficulty] || 30;
  const length = prompt?.length || 0;
  let extra = 0;

  if (length > 400) {
    extra = 10;
  } else if (length > 200) {
    extra = 5;
  }

  const total = Math.min(base + extra, 180);
  return total;
};
