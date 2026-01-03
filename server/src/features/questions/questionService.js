import CuratedQuestionProvider from './curated/CuratedQuestionProvider.js';
import WikidataTemplateQuestionProvider from './wikidata/WikidataTemplateQuestionProvider.js';
import { calculateTimeLimitSeconds } from '../../utils/timeLimit.js';
import { getNegativePoints, getPointsForDifficulty } from '../../utils/scoring.js';

const curatedProvider = new CuratedQuestionProvider();
const wikidataProvider = new WikidataTemplateQuestionProvider();

const pickDifficultyPlan = () => [
  'EASY',
  'EASY',
  'EASY',
  'EASY',
  'MEDIUM',
  'MEDIUM',
  'MEDIUM',
  'MEDIUM',
  'HARD',
  'HARD',
];

const pickTypePlan = () => [
  'MCQ',
  'MCQ',
  'MCQ',
  'MCQ',
  'MCQ',
  'MCQ',
  'MCQ',
  'ESSAY',
  'ESSAY',
  'ESSAY',
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const buildQuestionPlan = async () => {
  const difficulties = shuffle(pickDifficultyPlan());
  const types = shuffle(pickTypePlan());

  const questions = [];
  for (let i = 0; i < 10; i += 1) {
    const type = types[i];
    const difficulty = difficulties[i];
    let question;

    if (type === 'MCQ' && Math.random() < 0.3) {
      question = await wikidataProvider.getQuestion();
    } else {
      question = await curatedProvider.getQuestion({ type });
    }

    question.type = type;
    question.difficulty = difficulty;

    const pointsCorrect = getPointsForDifficulty(difficulty);
    const pointsWrong = question.negativeMarking ? getNegativePoints(difficulty) : 0;
    const timeLimitSeconds = calculateTimeLimitSeconds({
      type: question.type,
      difficulty,
      prompt: question.prompt,
    });

    questions.push({
      ...question,
      pointsCorrect,
      pointsWrong,
      timeLimitSeconds,
    });
  }

  return questions;
};
