import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Award, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { leaderboardService } from '@/services/leaderboardService';
import { LeaderboardEntry } from '@/types';
import { RankBadge } from '@/components/RankBadge';
import { formatHandicap } from '@/utils/formatters';

/**
 * HomePage - landingsside
 */
export function HomePage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    loadTopPlayers();
  }, []);

  const loadTopPlayers = async () => {
    try {
      const leaderboard = await leaderboardService.getLeaderboard(5);
      setTopPlayers(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section with Leaderboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Hero Content */}
          <div className="lg:col-span-2 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Your digital <span className="text-primary-600">golf assistant</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
              Track rounds, follow your handicap, and compete with friends. GolfTracker makes it
              easy to keep track of your golf progression.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>

          {/* Mini Leaderboard */}
          <div className="lg:col-span-1">
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-yellow-600" size={20} />
                <h3 className="text-lg sm:text-xl font-bold">Top Players</h3>
              </div>

              {loadingLeaderboard ? (
                <p className="text-gray-600 text-sm">Loading...</p>
              ) : topPlayers.length === 0 ? (
                <p className="text-gray-600 text-sm">No players yet</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {topPlayers.map((player, index) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm flex-shrink-0">
                          <RankBadge rank={index + 1} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm truncate">
                            {player.firstName} {player.lastName.charAt(0)}.
                          </p>
                          <p className="text-xs text-gray-600">
                            {player.roundsPlayed} {player.roundsPlayed === 1 ? 'round' : 'rounds'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-primary-600">
                          {formatHandicap(player.handicap)}
                        </p>
                        <p className="text-xs text-gray-500">HCP</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {topPlayers.length > 0 && (
                <Link
                  to={isAuthenticated ? '/leaderboard' : '/register'}
                  className="block mt-3 sm:mt-4 text-center text-primary-600 hover:underline text-xs sm:text-sm font-medium"
                >
                  {isAuthenticated ? 'View full leaderboard →' : 'Register to compete →'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="text-primary-600" size={40} />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Automatic Handicap</h3>
            <p className="text-sm sm:text-base text-gray-600">
              The app automatically calculates your handicap based on your registered rounds.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Users className="text-primary-600" size={40} />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Leaderboard</h3>
            <p className="text-sm sm:text-base text-gray-600">
              See how you rank against other players on the leaderboard.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Award className="text-primary-600" size={40} />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">History</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Complete overview of all your previous rounds and your development.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - Only show if not authenticated */}
      {!isAuthenticated && (
        <section className="bg-primary-600 text-white py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              Ready to get started?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8">
              Join the community and start tracking your golf progression today!
            </p>
            <Link
              to="/register"
              className="bg-white text-primary-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-sm sm:text-base"
            >
              Sign up now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
