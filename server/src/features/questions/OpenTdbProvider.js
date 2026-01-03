import QuestionProvider from './providers/QuestionProvider.js';

const decodeHtml = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&');

export default class OpenTdbProvider extends QuestionProvider {
  constructor() {
    super('OPENTDB');
  }

  async getQuestion() {
    const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
    if (!response.ok) {
      throw new Error('OpenTDB request failed');
    }
    const data = await response.json();
    const item = data.results?.[0];
    if (!item) {
      throw new Error('OpenTDB empty');
    }

    const options = [...item.incorrect_answers, item.correct_answer]
      .map(decodeHtml)
      .sort(() => Math.random() - 0.5);

    return {
      type: 'MCQ',
      prompt: decodeHtml(item.question),
      options,
      answer: decodeHtml(item.correct_answer),
      difficulty: item.difficulty.toUpperCase(),
      negativeMarking: false,
      citations: [],
      provider: this.name,
      attribution: 'Open Trivia Database',
    };
  }
}
