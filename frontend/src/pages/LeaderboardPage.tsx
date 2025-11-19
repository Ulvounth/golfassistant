import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { leaderboardService } from '@/services/leaderboardService';
import { LeaderboardEntry } from '@/types';

/**
 * LeaderboardPage - leaderboard basert på handicap
 */
export function LeaderboardPage() {
  const currentUser = useAuthStore(state => state.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await leaderboardService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">🏆 Leaderboard</h1>

      <div className="card">
        {loading ? (
          <p className="text-gray-600">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-gray-600">No players found.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUser?.id;
              const rank = index + 1;

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isCurrentUser
                      ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 text-center font-bold text-lg">{getMedalEmoji(rank)}</div>

                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {entry.firstName.charAt(0)}
                      {entry.lastName.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.firstName} {entry.lastName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-1 rounded">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.roundsPlayed} {entry.roundsPlayed === 1 ? 'round' : 'rounds'} played
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {entry.handicap.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">HCP</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <p className="text-blue-800">
          ℹ️ <strong>Leaderboard:</strong> Players are ranked by lowest handicap. The lower the
          handicap, the better the player!
        </p>
      </div>
    </div>
  );
}
