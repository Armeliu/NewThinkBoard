import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiRequest } from '../lib/api.js';

const MatchSummaryPage = () => {
  const { state } = useLocation();
  const { matchId: matchIdParam } = useParams();
  const { user, token } = useAuth();

  const matchId = state?.matchId || matchIdParam;

  const { data, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => apiRequest(`/matches/${matchId}`, { token }),
    enabled: Boolean(matchId && token),
  });

  if (!state && !matchId) {
    return (
      <main className="page">
        <h1>Match Summary</h1>
        <p>Summary unavailable.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Match Summary</h1>
      <div className="card">
        <p>Match ID: {matchId}</p>
        <p>
          Winner:{' '}
          {state?.winnerUserId
            ? state.winnerUserId === user?.id
              ? 'You'
              : 'Opponent'
            : 'Draw'}
        </p>
        <ul>
          {state?.scores &&
            Object.entries(state.scores).map(([playerId, score]) => (
              <li key={playerId}>
                {playerId === user?.id ? 'You' : 'Opponent'}: {score} pts
              </li>
            ))}
        </ul>
      </div>
      <div className="card">
        <h2>Question citations</h2>
        {isLoading && <p>Loading match details...</p>}
        {data?.match?.questions?.map((question, index) => (
          <div key={`${question.prompt}-${index}`}>
            <h3>
              Q{index + 1}: {question.prompt}
            </h3>
            {question.citations?.length ? (
              <ul>
                {question.citations.map((cite) => (
                  <li key={cite.url}>
                    <a href={cite.url} target="_blank" rel="noreferrer">
                      {cite.url}
                    </a>
                    <p>{cite.evidenceSnippet}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No citations for this question.</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
};

export default MatchSummaryPage;
