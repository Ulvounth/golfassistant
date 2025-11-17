import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Award, Target, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { leaderboardService } from '@/services/leaderboardService';
import { LeaderboardEntry } from '@/types';

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

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section with Leaderboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Hero Content */}
          <div className="lg:col-span-2 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Din digitale <span className="text-primary-600">golfassistent</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Registrer runder, følg handicap, og konkurrer med venner. GolfTracker gjør det enkelt
              å holde oversikt over din golfprogresjon.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary text-lg px-8 py-3">
                  Kom i gang gratis
                </Link>
                <Link to="/login" className="btn-outline text-lg px-8 py-3">
                  Logg inn
                </Link>
              </div>
            )}
          </div>

          {/* Mini Leaderboard */}
          <div className="lg:col-span-1">
            <div className="card bg-white shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-yellow-600" size={24} />
                <h3 className="text-xl font-bold">Topp spillere</h3>
              </div>

              {loadingLeaderboard ? (
                <p className="text-gray-600 text-sm">Laster...</p>
              ) : topPlayers.length === 0 ? (
                <p className="text-gray-600 text-sm">Ingen spillere ennå</p>
              ) : (
                <div className="space-y-3">
                  {topPlayers.map((player, index) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-center font-bold text-sm">
                          {getMedalEmoji(index + 1)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {player.firstName} {player.lastName.charAt(0)}.
                          </p>
                          <p className="text-xs text-gray-600">
                            {player.roundsPlayed} {player.roundsPlayed === 1 ? 'runde' : 'runder'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          {player.handicap.toFixed(1)}
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
                  className="block mt-4 text-center text-primary-600 hover:underline text-sm font-medium"
                >
                  {isAuthenticated ? 'Se full leaderboard →' : 'Registrer deg for å konkurrere →'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Funksjoner</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Automatisk handicap</h3>
            <p className="text-gray-600">
              Appen beregner automatisk handicap basert på dine registrerte runder.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Target className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Detaljert statistikk</h3>
            <p className="text-gray-600">
              Registrer score per hull, fairways, greens in regulation og putter.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Users className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
            <p className="text-gray-600">
              Se hvordan du rangerer mot andre spillere på leaderboardet.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Award className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Historikk</h3>
            <p className="text-gray-600">
              Full oversikt over alle dine tidligere runder og din utvikling.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - Only show if not authenticated */}
      {!isAuthenticated && (
        <section className="bg-primary-600 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Klar til å starte?</h2>
            <p className="text-xl mb-8">
              Bli med i fellesskapet og begynn å spore din golfprogresjon i dag!
            </p>
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Registrer deg nå
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
