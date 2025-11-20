import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewRoundPage } from './pages/NewRoundPage';
import { EditRoundPage } from './pages/EditRoundPage';
import { RoundHistoryPage } from './pages/RoundHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Beskyttede ruter */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="new-round" element={<NewRoundPage />} />
          <Route path="rounds/:id/edit" element={<EditRoundPage />} />
          <Route path="history" element={<RoundHistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
