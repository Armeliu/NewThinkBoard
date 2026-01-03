import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import LobbyPage from '../pages/LobbyPage.jsx';
import RoomPage from '../pages/RoomPage.jsx';
import MatchPage from '../pages/MatchPage.jsx';
import MatchSummaryPage from '../pages/MatchSummaryPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/lobby" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/room/:code" element={<RoomPage />} />
      <Route path="/match/:matchId" element={<MatchPage />} />
      <Route path="/match/:matchId/summary" element={<MatchSummaryPage />} />
    </Routes>
  );
};

export default App;
