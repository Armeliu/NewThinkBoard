import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['MCQ', 'ESSAY'], required: true },
    prompt: { type: String, required: true },
    options: { type: [String], default: [] },
    answer: { type: String },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: true },
    negativeMarking: { type: Boolean, default: false },
    rubric: { type: Object },
    citations: { type: [Object], default: [] },
    provider: { type: String, default: 'CURATED' },
  },
  { timestamps: true }
);

const QuestionBank = mongoose.model('QuestionBank', questionSchema);

export default QuestionBank;
