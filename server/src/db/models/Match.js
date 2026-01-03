import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    evidenceSnippet: { type: String, required: true },
    sourceType: { type: String, required: true },
  },
  { _id: false }
);

const questionSnapshotSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['MCQ', 'ESSAY'], required: true },
    prompt: { type: String, required: true },
    options: { type: [String], default: [] },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: true },
    pointsCorrect: { type: Number, required: true },
    pointsWrong: { type: Number, default: 0 },
    timeLimitSeconds: { type: Number, required: true },
    citations: { type: [citationSchema], default: [] },
    provider: { type: String, required: true },
    negativeMarking: { type: Boolean, default: false },
    rubric: { type: Object },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answer: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    correctAnswer: { type: String },
    awarded: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          points: { type: Number, required: true },
          status: {
            type: String,
            enum: ['SCORED', 'PENDING_AI'],
            default: 'SCORED',
          },
          rubric: { type: Object },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    players: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          username: { type: String, required: true },
        },
      ],
      default: [],
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    winnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    questions: { type: [questionSnapshotSchema], default: [] },
    submissions: { type: [submissionSchema], default: [] },
    results: { type: [resultSchema], default: [] },
    scoreTimeline: { type: [Object], default: [] },
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema);

export default Match;
