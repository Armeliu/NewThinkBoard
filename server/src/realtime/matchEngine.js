import Match from '../db/models/Match.js';
import Room from '../db/models/Room.js';
import { buildQuestionPlan } from '../features/questions/questionService.js';
import { scoreMcq } from '../utils/scoring.js';
import { judgeEssay } from '../features/ai/ollamaJudge.js';
import { phases, nextPhase } from './stateMachine.js';

const activeMatches = new Map();

const buildSnapshot = (state, userId) => {
  return {
    matchId: state.matchId,
    roomCode: state.roomCode,
    phase: state.phase,
    currentQuestionIndex: state.questionIndex,
    serverStartTs: state.serverStartTs,
    timeLimitSeconds: state.timeLimitSeconds,
    scores: state.scores,
    submitted: state.submissions[state.questionIndex]?.[userId] != null,
    reconnectCountdown: state.reconnectCountdowns[userId] || 0,
  };
};

const persistSubmission = async (state, userId, answer) => {
  await Match.updateOne(
    { _id: state.matchId },
    {
      $push: {
        submissions: {
          questionIndex: state.questionIndex,
          userId,
          answer,
          submittedAt: new Date(),
        },
      },
    }
  );
};

const persistResult = async (state, result) => {
  await Match.updateOne(
    { _id: state.matchId },
    {
      $push: {
        results: result,
        scoreTimeline: {
          questionIndex: state.questionIndex,
          scores: state.scores,
          timestamp: new Date(),
        },
      },
    }
  );
};

const finishMatch = async (io, state, reason = 'FINISHED', forfeitingUserId = null) => {
  state.phase = phases.FINISHED;
  if (state.questionTimeout) {
    clearTimeout(state.questionTimeout);
  }
  Object.values(state.disconnectTimers).forEach((timer) => clearTimeout(timer));
  Object.values(state.disconnectIntervals).forEach((interval) => clearInterval(interval));
  const players = state.players;
  const [p1, p2] = players;
  const p1Score = state.scores[p1.userId] || 0;
  const p2Score = state.scores[p2.userId] || 0;
  let winnerUserId = null;
  if (p1Score > p2Score) winnerUserId = p1.userId;
  if (p2Score > p1Score) winnerUserId = p2.userId;

  await Match.updateOne(
    { _id: state.matchId },
    {
      endedAt: new Date(),
      winnerUserId,
    }
  );
  await Room.updateOne({ code: state.roomCode }, { status: 'FINISHED' });

  io.to(state.roomCode).emit('match:finished', {
    matchId: state.matchId,
    scores: state.scores,
    winnerUserId,
    reason,
  });

  if (reason === 'FORFEIT') {
    io.to(state.roomCode).emit('match:forfeit', {
      matchId: state.matchId,
      forfeitingUserId,
      scores: state.scores,
    });
  }

  activeMatches.delete(state.roomCode);
};

const emitQuestionStart = (io, state) => {
  const question = state.questions[state.questionIndex];
  state.serverStartTs = Date.now();
  state.timeLimitSeconds = question.timeLimitSeconds;

  io.to(state.roomCode).emit('question:start', {
    question: {
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      difficulty: question.difficulty,
      pointsCorrect: question.pointsCorrect,
      pointsWrong: question.pointsWrong,
      negativeMarking: question.negativeMarking,
      citations: question.citations,
      provider: question.provider,
    },
    serverStartTs: state.serverStartTs,
    timeLimitSeconds: question.timeLimitSeconds,
    questionIndex: state.questionIndex,
  });
};

const lockQuestion = async (io, state) => {
  state.phase = phases.SHOW_RESULTS;
  const question = state.questions[state.questionIndex];
  const result = {
    questionIndex: state.questionIndex,
    correctAnswer: question.type === 'MCQ' ? question.answer : undefined,
    awarded: [],
  };

  for (const player of state.players) {
    const answer = state.submissions[state.questionIndex]?.[player.userId];
    if (!answer) {
      result.awarded.push({ userId: player.userId, points: 0, status: 'SCORED' });
      continue;
    }

    if (question.type === 'MCQ') {
      const isCorrect = answer === question.answer;
      const points = scoreMcq({
        isCorrect,
        difficulty: question.difficulty,
        negativeMarking: question.negativeMarking,
      });
      state.scores[player.userId] = (state.scores[player.userId] || 0) + points;
      result.awarded.push({ userId: player.userId, points, status: 'SCORED' });
    } else {
      const judged = await judgeEssay({
        prompt: question.prompt,
        answer,
        pointsCorrect: question.pointsCorrect,
        rubric: question.rubric,
      });

      if (judged.status === 'SCORED') {
        const points = judged.result.score;
        state.scores[player.userId] = (state.scores[player.userId] || 0) + points;
        result.awarded.push({
          userId: player.userId,
          points,
          status: 'SCORED',
          rubric: judged.result,
        });
      } else {
        result.awarded.push({
          userId: player.userId,
          points: 0,
          status: 'PENDING_AI',
        });
      }
    }
  }

  await persistResult(state, result);

  io.to(state.roomCode).emit('question:result', {
    questionIndex: state.questionIndex,
    correctAnswer: question.type === 'MCQ' ? question.answer : undefined,
    awarded: result.awarded,
    scores: state.scores,
    citations: question.citations,
    rubric: result.awarded.find((entry) => entry.rubric)?.rubric,
  });

  state.questionIndex += 1;
  state.phase = nextPhase({
    phase: phases.SHOW_RESULTS,
    questionIndex: state.questionIndex - 1,
    totalQuestions: state.questions.length,
  });

  if (state.phase === phases.FINISHED) {
    await finishMatch(io, state);
    return;
  }

  setTimeout(() => {
    state.phase = phases.NEXT_QUESTION;
    emitQuestionStart(io, state);
    state.phase = phases.IN_QUESTION;
    state.questionTimeout = setTimeout(() => lockQuestion(io, state), question.timeLimitSeconds * 1000);
  }, 2000);
};

export const startMatch = async (io, room, players) => {
  const questions = await buildQuestionPlan();
  const match = await Match.create({
    roomCode: room.code,
    players: players.map((player) => ({ userId: player.userId, username: player.username })),
    questions,
  });

  const state = {
    roomCode: room.code,
    matchId: match._id.toString(),
    phase: phases.COUNTDOWN,
    questionIndex: 0,
    questions,
    scores: players.reduce((acc, player) => ({ ...acc, [player.userId]: 0 }), {}),
    submissions: {},
    players,
    serverStartTs: null,
    timeLimitSeconds: null,
    questionTimeout: null,
    disconnectTimers: {},
    disconnectIntervals: {},
    reconnectCountdowns: {},
  };

  activeMatches.set(room.code, state);

  io.to(room.code).emit('match:started', { matchId: match._id.toString(), roomCode: room.code });
  io.to(room.code).emit('match:countdown', { seconds: 3 });
  setTimeout(() => {
    io.to(room.code).emit('match:countdown', { seconds: 2 });
  }, 1000);
  setTimeout(() => {
    io.to(room.code).emit('match:countdown', { seconds: 1 });
  }, 2000);

  setTimeout(() => {
    state.phase = phases.IN_QUESTION;
    emitQuestionStart(io, state);
    state.questionTimeout = setTimeout(
      () => lockQuestion(io, state),
      state.questions[state.questionIndex].timeLimitSeconds * 1000
    );
  }, 3000);

  return state;
};

export const handleSubmission = async (io, state, userId, answer) => {
  if (state.phase !== phases.IN_QUESTION) {
    return { error: 'Not accepting submissions' };
  }

  const question = state.questions[state.questionIndex];
  const now = Date.now();
  if (now > state.serverStartTs + question.timeLimitSeconds * 1000) {
    return { error: 'Time expired' };
  }

  if (!state.submissions[state.questionIndex]) {
    state.submissions[state.questionIndex] = {};
  }

  if (state.submissions[state.questionIndex][userId]) {
    return { error: 'Already submitted' };
  }

  state.submissions[state.questionIndex][userId] = answer;
  await persistSubmission(state, userId, answer);

  const allSubmitted = state.players.every(
    (player) => state.submissions[state.questionIndex][player.userId]
  );

  if (allSubmitted) {
    clearTimeout(state.questionTimeout);
    await lockQuestion(io, state);
  }

  return { ok: true };
};

export const getMatchState = (roomCode) => activeMatches.get(roomCode);

export const handleDisconnect = (io, state, userId) => {
  if (!state) return;
  if (state.disconnectTimers[userId]) return;

  state.reconnectCountdowns[userId] = 30;
  io.to(state.roomCode).emit('match:disconnect', {
    userId,
    countdownSeconds: 30,
  });

  const interval = setInterval(() => {
    state.reconnectCountdowns[userId] -= 1;
    if (state.reconnectCountdowns[userId] <= 0) {
      clearInterval(interval);
    }
  }, 1000);

  state.disconnectIntervals[userId] = interval;
  state.disconnectTimers[userId] = setTimeout(() => {
    finishMatch(io, state, 'FORFEIT', userId);
  }, 30000);
};

export const handleReconnect = (io, state, userId) => {
  if (!state) return;
  if (state.disconnectTimers[userId]) {
    clearTimeout(state.disconnectTimers[userId]);
    delete state.disconnectTimers[userId];
  }
  if (state.disconnectIntervals[userId]) {
    clearInterval(state.disconnectIntervals[userId]);
    delete state.disconnectIntervals[userId];
  }
  state.reconnectCountdowns[userId] = 0;
  io.to(state.roomCode).emit('match:reconnect', { userId });
};

export const sendSnapshot = (socket, state, userId) => {
  socket.emit('match:snapshot', buildSnapshot(state, userId));
};

export default { startMatch, handleSubmission, getMatchState, handleDisconnect, handleReconnect, sendSnapshot };
