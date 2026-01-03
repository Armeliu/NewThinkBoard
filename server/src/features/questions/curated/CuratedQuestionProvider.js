import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QuestionProvider from '../providers/QuestionProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class CuratedQuestionProvider extends QuestionProvider {
  constructor() {
    super('CURATED');
    this.questions = [];
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    const filePath = path.join(__dirname, 'questions.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    this.questions = JSON.parse(raw);
    this.loaded = true;
  }

  async getQuestion({ type } = {}) {
    await this.load();
    const candidates = type
      ? this.questions.filter((question) => question.type === type)
      : this.questions;
    const index = Math.floor(Math.random() * candidates.length);
    const question = candidates[index];
    return { ...question, provider: this.name };
  }
}
