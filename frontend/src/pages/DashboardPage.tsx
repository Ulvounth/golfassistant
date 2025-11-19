import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { PlusCircle, History, TrendingUp, Trophy } from 'lucide-react';
import { roundService } from '@/services/roundService';
import { leaderboardService } from '@/services/leaderboardService';
import { userService } from '@/services/userService';
import { GolfRound } from '@/types';

/**
 * DashboardPage - brukerens dashboard
 */
export function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [ranking, setRanking] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      // Hent oppdatert brukerdata
      const userData = await userService.getProfile();
      updateUser(userData);

      // Hent runder
      const roundsData = await roundService.getRounds();
      setRounds(roundsData);

      // Hent leaderboard for å finne rangering
      const leaderboard = await leaderboardService.getLeaderboard();
      const userRank = leaderboard.findIndex(entry => entry.userId === userData.id);
      setRanking(userRank >= 0 ? userRank + 1 : null);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return 'text-blue-600 font-bold';
    if (diff === -1) return 'text-green-600 font-semibold';
    if (diff === 0) return 'text-gray-700';
    if (diff === 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const recentRounds = rounds.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.firstName}! 👋</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Your Handicap</p>
              <p className="text-3xl font-bold text-primary-600">{user?.handicap.toFixed(1)}</p>
            </div>
            <TrendingUp className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rounds Played</p>
              <p className="text-3xl font-bold">{loading ? '-' : rounds.length}</p>
            </div>
            <History className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ranking</p>
              <p className="text-3xl font-bold">{loading ? '-' : ranking ? `#${ranking}` : '-'}</p>
            </div>
            <Trophy className="text-yellow-600" size={40} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/new-round"
            className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <PlusCircle className="text-primary-600" size={32} />
            <div>
              <h3 className="font-semibold text-lg">Register New Round</h3>
              <p className="text-gray-600 text-sm">Add a new golf round</p>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <History className="text-blue-600" size={32} />
            <div>
              <h3 className="font-semibold text-lg">View History</h3>
              <p className="text-gray-600 text-sm">Overview of all your rounds</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Rounds</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : recentRounds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>You haven't registered any rounds yet.</p>
            <Link to="/new-round" className="btn-primary mt-4 inline-block">
              Register your first round
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRounds.map(round => (
              <div key={round.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{round.courseName}</h4>
                    <p className="text-sm text-gray-600">{formatDate(round.date)}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${getScoreColor(
                        round.totalScore,
                        round.totalPar
                      )}`}
                    >
                      {round.totalScore}
                    </p>
                    <p className="text-sm text-gray-600">
                      Par {round.totalPar}
                      {' • '}
                      {round.totalScore - round.totalPar > 0 ? '+' : ''}
                      {round.totalScore - round.totalPar}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {rounds.length > 5 && (
              <Link
                to="/profile"
                className="block text-center text-primary-600 hover:underline pt-2"
              >
                View all {rounds.length} rounds →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
