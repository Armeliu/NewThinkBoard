import { useEffect, useState } from 'react';

const LobbyPage = () => {
  const [status, setStatus] = useState('Checking API...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.ok) {
          setStatus('API OK');
        } else {
          setStatus('API not ready');
        }
      } catch (error) {
        setStatus('API unreachable');
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="page">
      <h1>QuizDuel Lobby</h1>
      <p>{status}</p>
    </main>
  );
};

export default LobbyPage;
