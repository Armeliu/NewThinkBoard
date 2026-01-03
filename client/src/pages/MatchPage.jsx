import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { connectSocket, getSocket } from '../lib/socket.js';

const MatchPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [matchId, setMatchId] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [phase, setPhase] = useState('LOBBY');
  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(0);
  const [scores, setScores] = useState({});
  const [result, setResult] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reconnect, setReconnect] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket() || connectSocket(token);

    const handleCountdown = (payload) => setPhase(`COUNTDOWN_${payload.seconds}`);
    const handleStarted = (payload) => {
      setMatchId(payload.matchId);
      if (payload.roomCode) {
        setRoomCode(payload.roomCode);
      }
    };
    const handleQuestionStart = (payload) => {
      setPhase('IN_QUESTION');
      setQuestion(payload.question);
      setTimer(payload.timeLimitSeconds);
      setResult(null);
      setAnswer('');
      setSubmitted(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - payload.serverStartTs) / 1000);
        const remaining = Math.max(payload.timeLimitSeconds - elapsed, 0);
        setTimer(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 500);
      timerRef.current = interval;
    };

    const handleResult = (payload) => {
      setPhase('SHOW_RESULTS');
      setResult(payload);
      setScores(payload.scores);
    };

    const handleFinished = (payload) => {
      setScores(payload.scores);
      navigate(`/match/${payload.matchId}/summary`, { state: payload });
    };

    const handleDisconnect = (payload) => setReconnect(payload.countdownSeconds);
    const handleReconnect = () => setReconnect(null);
    const handleSnapshot = (payload) => {
      setPhase(payload.phase);
      setScores(payload.scores || {});
      setMatchId(payload.matchId);
      setRoomCode(payload.roomCode || '');
      setSubmitted(payload.submitted);
      if (payload.timeLimitSeconds) {
        setTimer(payload.timeLimitSeconds);
      }
      if (payload.reconnectCountdown) {
        setReconnect(payload.reconnectCountdown);
      }
    };

    socket.on('match:countdown', handleCountdown);
    socket.on('match:started', handleStarted);
    socket.on('question:start', handleQuestionStart);
    socket.on('question:result', handleResult);
    socket.on('match:finished', handleFinished);
    socket.on('match:disconnect', handleDisconnect);
    socket.on('match:reconnect', handleReconnect);
    socket.on('match:snapshot', handleSnapshot);

    return () => {
      socket.off('match:countdown', handleCountdown);
      socket.off('match:started', handleStarted);
      socket.off('question:start', handleQuestionStart);
      socket.off('question:result', handleResult);
      socket.off('match:finished', handleFinished);
      socket.off('match:disconnect', handleDisconnect);
      socket.off('match:reconnect', handleReconnect);
      socket.off('match:snapshot', handleSnapshot);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [token, navigate]);

  const totalScore = useMemo(() => scores[user?.id] || 0, [scores, user]);

  const handleSubmit = () => {
    const socket = getSocket();
    if (!socket || !question || submitted) return;
    socket.emit('match:submit', { roomCode, answer });
    setSubmitted(true);
  };

  return (
    <main className="page">
      <h1>Match</h1>
      {matchId && <p>Match ID: {matchId}</p>}
      {reconnect && (
        <div className="banner warning">Reconnecting... {reconnect}s to forfeit.</div>
      )}
      <div className="card">
        <p>Phase: {phase}</p>
        <p>Timer: {timer}s</p>
        <p>Your score: {totalScore}</p>
        <div>
          <h3>Live scoreboard</h3>
          <ul>
            {Object.entries(scores).map(([playerId, score]) => (
              <li key={playerId}>
                {playerId === user?.id ? 'You' : 'Opponent'}: {score} pts
              </li>
            ))}
          </ul>
        </div>
        {question && (
          <div className="question">
            <p className="meta">
              {question.difficulty} · {question.pointsCorrect} pts
              {question.negativeMarking && ` · Wrong: ${question.pointsWrong}`}
            </p>
            <h2>{question.prompt}</h2>
            {question.type === 'MCQ' ? (
              <ul className="options">
                {question.options.map((option) => (
                  <li key={option}>
                    <label>
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={answer === option}
                        onChange={() => setAnswer(option)}
                        disabled={submitted}
                      />
                      {option}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={6}
                disabled={submitted}
              />
            )}
            <button onClick={handleSubmit} disabled={!answer || submitted}>
              Submit
            </button>
          </div>
        )}
        {result && (
          <div className="result">
            <h3>Results</h3>
            {result.correctAnswer && <p>Correct answer: {result.correctAnswer}</p>}
            <ul>
              {result.awarded.map((entry) => (
                <li key={entry.userId}>
                  {entry.userId === user?.id ? 'You' : 'Opponent'}: {entry.points} pts{' '}
                  {entry.status === 'PENDING_AI' ? '(pending AI)' : ''}
                </li>
              ))}
            </ul>
            {result.citations?.length > 0 && (
              <div>
                <h4>Sources</h4>
                <ul>
                  {result.citations.map((cite) => (
                    <li key={cite.url}>
                      <a href={cite.url} target="_blank" rel="noreferrer">
                        {cite.url}
                      </a>
                      <p>{cite.evidenceSnippet}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default MatchPage;
