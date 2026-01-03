import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import connectToDatabase from './connect.js';
import QuestionBank from './models/QuestionBank.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seed = async () => {
  await connectToDatabase();
  const filePath = path.join(__dirname, '../features/questions/curated/questions.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const questions = JSON.parse(raw);

  await QuestionBank.deleteMany({ provider: 'CURATED' });
  await QuestionBank.insertMany(
    questions.map((question) => ({
      ...question,
      provider: 'CURATED',
    }))
  );

  console.log(`Seeded ${questions.length} curated questions.`);
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
