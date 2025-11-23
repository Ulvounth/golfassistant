import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { leaderboardService } from '@/services/leaderboardService';
import { LeaderboardEntry } from '@/types';
import { RankBadge } from '@/components/RankBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { formatHandicap } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">🏆 Leaderboard</h1>

      <div className="card">
        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
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
                  className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
                    isCurrentUser
                      ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank badge */}
                  <div className="flex-shrink-0 w-10 sm:w-12">
                    <RankBadge rank={rank} />
                  </div>

                  {/* Avatar - hidden on very small screens */}
                  <div className="hidden xs:block flex-shrink-0">
                    <UserAvatar firstName={entry.firstName} lastName={entry.lastName} size="md" />
                  </div>

                  {/* Name and rounds */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {entry.firstName} {entry.lastName}
                      {isCurrentUser && (
                        <span className="ml-1 sm:ml-2 text-xs bg-primary-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                          YOU
                        </span>
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {entry.roundsPlayed} {entry.roundsPlayed === 1 ? 'round' : 'rounds'}
                    </p>
                  </div>

                  {/* Handicap */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-primary-600">
                      {formatHandicap(entry.handicap)}
                    </p>
                    <p className="text-xs text-gray-500">HCP</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg text-xs sm:text-sm">
        <p className="text-blue-800">
          ℹ️ <strong>Leaderboard:</strong> Players are ranked by lowest handicap. The lower the
          handicap, the better the player!
        </p>
      </div>
    </div>
  );
}
