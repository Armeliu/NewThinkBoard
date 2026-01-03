import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: form });
      login(data.token, data.user);
      navigate('/lobby');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page">
      <h1>Login</h1>
      <form className="card" onSubmit={handleSubmit}>
        <label className="field">
          Username
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            required
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </main>
  );
};

export default LoginPage;
