import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { connectSocket } from '../lib/socket.js';

const LobbyPage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [status, setStatus] = useState('Checking API...');
  const [code, setCode] = useState('');

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

  const handleCreate = async () => {
    try {
      const data = await apiRequest('/rooms/create', { method: 'POST', token, body: {} });
      connectSocket(token);
      navigate(`/room/${data.roomCode}`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleJoin = async () => {
    try {
      const data = await apiRequest('/rooms/join', {
        method: 'POST',
        token,
        body: { code },
      });
      connectSocket(token);
      navigate(`/room/${data.roomCode}`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <main className="page">
      <h1>QuizDuel Lobby</h1>
      {user ? <p>Signed in as {user.username}</p> : <p>Please login to play.</p>}
      <div className="card">
        <p>{status}</p>
        <div className="actions">
          <button onClick={handleCreate} disabled={!token}>
            Create room
          </button>
          <div className="join">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={5}
            />
            <button onClick={handleJoin} disabled={!token || code.length !== 5}>
              Join room
            </button>
          </div>
        </div>
        {token && (
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </main>
  );
};

export default LobbyPage;
