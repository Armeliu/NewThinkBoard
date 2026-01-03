import { useParams } from 'react-router-dom';

const MatchSummaryPage = () => {
  const { matchId } = useParams();

  return (
    <main className="page">
      <h1>Match {matchId} Summary</h1>
      <p>Summary details go here.</p>
    </main>
  );
};

export default MatchSummaryPage;
