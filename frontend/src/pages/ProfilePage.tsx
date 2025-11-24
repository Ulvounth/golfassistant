import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { roundService } from '@/services/roundService';
import { userService } from '@/services/userService';
import { GolfRound } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';
import { RoundCard } from '@/components/RoundCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatHandicap } from '@/utils/formatters';

/**
 * ProfilePage - brukerens profilside med runde-historikk
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Hent oppdatert brukerdata
      const userData = await userService.getProfile();
      updateUser(userData);

      // Hent første side med runder
      const roundsData = await roundService.getRounds(20);
      setRounds(roundsData.rounds);
      setNextToken(roundsData.nextToken);
      setHasMore(roundsData.hasMore);

      // Hent navn på alle spillere som er med i rundene
      await loadPlayerNames(roundsData.rounds);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRounds = async () => {
    if (!nextToken || loadingMore) return;

    try {
      setLoadingMore(true);
      const roundsData = await roundService.getRounds(20, nextToken);

      // Legg til nye runder til eksisterende liste
      setRounds(prev => [...prev, ...roundsData.rounds]);
      setNextToken(roundsData.nextToken);
      setHasMore(roundsData.hasMore);

      // Hent navn på nye spillere
      await loadPlayerNames(roundsData.rounds);
    } catch (error) {
      console.error('Failed to load more rounds:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadPlayerNames = async (roundsData: GolfRound[]) => {
    try {
      // Samle alle unike player IDs fra alle runder
      const allPlayerIds = new Set<string>();
      roundsData.forEach(round => {
        if (round.players) {
          round.players.forEach(playerId => allPlayerIds.add(playerId));
        }
      });

      if (allPlayerIds.size === 0) return;

      // Hent brukerinfo for alle spillere
      const players = await userService.batchGetUsers(Array.from(allPlayerIds));

      // Lag en map av userId -> fullt navn
      const namesMap: Record<string, string> = {};
      players.forEach(player => {
        namesMap[player.id] = `${player.firstName} ${player.lastName}`;
      });

      setPlayerNames(namesMap);
    } catch (error) {
      console.error('Failed to load player names:', error);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    try {
      setUploading(true);
      const result = await userService.uploadProfileImage(file);

      // Update user in store with new image URL
      if (user) {
        updateUser({ ...user, profileImageUrl: result.profileImageUrl });
      }
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRecalculateHandicap = async () => {
    try {
      setRecalculating(true);
      const updatedUser = await userService.recalculateHandicap();
      updateUser(updatedUser);
      toast.success('Handicap recalculated successfully!');
    } catch (error) {
      console.error('Failed to recalculate handicap:', error);
      toast.error('Failed to recalculate handicap. Please try again.');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">My Profile</h1>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="relative group flex-shrink-0">
            <UserAvatar
              firstName={user?.firstName || ''}
              lastName={user?.lastName || ''}
              imageUrl={user?.profileImageUrl}
              size="lg"
            />
            <button
              onClick={handleImageClick}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Change profile picture"
            >
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </button>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
              <p className="text-primary-600 font-semibold text-sm sm:text-base">
                Handicap: {formatHandicap(user?.handicap || 0)}
              </p>
              <button
                onClick={handleRecalculateHandicap}
                disabled={recalculating}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Recalculate handicap based on current rounds"
              >
                <RefreshCw className={`w-3 h-3 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">My Rounds</h3>

        {loading ? (
          <LoadingSpinner message="Loading rounds..." />
        ) : rounds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't registered any rounds yet.</p>
            <a href="/new-round" className="btn-primary inline-block">
              Register your first round
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map(round => (
              <RoundCard
                key={round.id}
                round={round}
                showEditButton
                onEdit={id => navigate(`/rounds/${id}/edit`)}
                playerNames={playerNames}
              />
            ))}

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreRounds}
                  disabled={loadingMore}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Loading...
                    </>
                  ) : (
                    'Load more rounds'
                  )}
                </button>
              </div>
            )}

            {rounds.length >= 20 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="text-blue-800">
                  ℹ️ <strong>WHS Handicap:</strong> Your handicap is calculated from the average of
                  your 8 best score differentials from your last 20 rounds.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
