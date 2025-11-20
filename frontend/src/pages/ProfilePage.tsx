import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { roundService } from '@/services/roundService';
import { userService } from '@/services/userService';
import { GolfRound } from '@/types';

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
    if (diff <= -2) return 'text-blue-600 font-bold'; // Eagle or better
    if (diff === -1) return 'text-green-600 font-semibold'; // Birdie
    if (diff === 0) return 'text-gray-700'; // Par
    if (diff === 1) return 'text-orange-600'; // Bogey
    return 'text-red-600'; // Double bogey or worse
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    try {
      setUploading(true);
      const result = await userService.uploadProfileImage(file);

      // Update user in store with new image URL
      if (user) {
        updateUser({ ...user, profileImageUrl: result.profileImageUrl });
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="card mb-6">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
                {user?.firstName.charAt(0)}
                {user?.lastName.charAt(0)}
              </div>
            )}
            <button
              onClick={handleImageClick}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Change profile picture"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
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
          <div>
            <h2 className="text-2xl font-semibold">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-primary-600 font-semibold mt-1">
              Handicap: {user?.handicap.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4">My Rounds</h3>

        {loading ? (
          <p className="text-gray-600">Loading rounds...</p>
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
              <div key={round.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{round.courseName}</h4>
                    <p className="text-sm text-gray-600">{formatDate(round.date)}</p>
                  </div>
                  <div className="flex items-start gap-3">
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
                    <button
                      onClick={() => navigate(`/rounds/${round.id}/edit`)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit round"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                  <span>
                    {round.teeColor === 'white' && '⚪ White'}
                    {round.teeColor === 'yellow' && '🟡 Yellow'}
                    {round.teeColor === 'blue' && '🔵 Blue'}
                    {round.teeColor === 'red' && '🔴 Red'}
                  </span>
                  <span>• {round.numberOfHoles} holes</span>
                  <span>• Differential: {round.scoreDifferential.toFixed(1)}</span>
                </div>

                {round.players && round.players.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                    <span className="font-medium">👥 Played with: </span>
                    <span className="ml-1">
                      {round.players.map((playerId, index) => (
                        <span key={playerId}>
                          {playerNames[playerId] || 'Loading...'}
                          {index < round.players.length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
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
