import { useParams } from 'react-router-dom';

const MatchPage = () => {
  const { matchId } = useParams();

  return (
    <main className="page">
      <h1>Match {matchId}</h1>
      <p>Match play goes here.</p>
    </main>
  );
};

export default MatchPage;
