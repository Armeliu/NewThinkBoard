import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { connectSocket, getSocket } from '../lib/socket.js';

const RoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket() || connectSocket(token);

    const handleState = (payload) => {
      setRoom(payload);
    };

    const handleStarted = (payload) => {
      setMatchId(payload.matchId);
      navigate(`/match/${payload.matchId}`);
    };

    socket.on('room:state', handleState);
    socket.on('room:error', (payload) => setError(payload.message));
    socket.on('match:started', handleStarted);

    return () => {
      socket.off('room:state', handleState);
      socket.off('room:error');
      socket.off('match:started', handleStarted);
    };
  }, [token, navigate]);

  const handleReady = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('room:ready', { code, ready: true });
  };

  return (
    <main className="page">
      <h1>Room {code}</h1>
      {error && <p className="error">{error}</p>}
      <div className="card">
        {room ? (
          <>
            <p>Status: {room.status}</p>
            <ul>
              {room.players.map((player) => (
                <li key={player.userId}>
                  {player.userId === user?.id ? 'You' : 'Opponent'} -{' '}
                  {player.ready ? 'Ready' : 'Not ready'}
                </li>
              ))}
            </ul>
            <button onClick={handleReady}>Ready</button>
            {matchId && <p>Match starting... {matchId}</p>}
          </>
        ) : (
          <p>Waiting for room state...</p>
        )}
      </div>
    </main>
  );
};

export default RoomPage;
