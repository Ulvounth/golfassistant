import { useState, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { roundService } from '@/services/roundService';
import { userService, UserSearchResult } from '@/services/userService';
import { GolfRound, HoleScore } from '@/types';

/**
 * EditRoundPage - side for å redigere eksisterende golfrunde
 */
export function EditRoundPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const currentUserId = useAuthStore(state => state.user?.id);

  const [round, setRound] = useState<GolfRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTee, setSelectedTee] = useState<'white' | 'yellow' | 'blue' | 'red'>('yellow');
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18);
  const [roundDate, setRoundDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPlayers, setSelectedPlayers] = useState<UserSearchResult[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerSearchResults, setPlayerSearchResults] = useState<UserSearchResult[]>([]);
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
  const [playerScores, setPlayerScores] = useState<Record<string, HoleScore[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redirect til login hvis ikke autentisert
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
    }
  }, [isAuthenticated, navigate]);

  // Load round data
  useEffect(() => {
    if (id) {
      loadRound(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadRound = async (roundId: string) => {
    try {
      const roundData = await roundService.getRound(roundId);

      // Check if user owns this round
      if (roundData.userId !== currentUserId) {
        alert('⛔ You can only edit your own rounds');
        navigate('/profile');
        return;
      }

      setRound(roundData);
      setSelectedTee(roundData.teeColor);
      setNumberOfHoles(roundData.numberOfHoles);
      setRoundDate(roundData.date.split('T')[0]); // Extract date part
      setHoleScores(roundData.holes);

      // Load players who were in the round
      if (roundData.players && roundData.players.length > 0) {
        loadPlayersInfo(roundData.players, roundData);
      }
    } catch (error) {
      console.error('Failed to load round:', error);
      alert('❌ Failed to load round');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayersInfo = async (playerIds: string[], roundData: GolfRound) => {
    try {
      // Use batch endpoint to get player info
      const players = await userService.batchGetUsers(playerIds);
      setSelectedPlayers(players);

      // Load their scores from their rounds on the same date/course
      await loadPlayerScores(playerIds, roundData);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadPlayerScores = async (playerIds: string[], roundData: GolfRound) => {
    try {
      // Hent alle runder for disse spillerne på samme dato/bane
      const relatedRounds = await roundService.getRoundsByCriteria(
        roundData.date,
        roundData.courseId,
        playerIds
      );

      // Map rundene til playerScores
      const scoresMap: Record<string, HoleScore[]> = {};

      for (const relatedRound of relatedRounds) {
        scoresMap[relatedRound.userId] = relatedRound.holes;
      }

      // Hvis en spiller ikke har en runde (f.eks. nettopp lagt til), initialiser med par
      for (const playerId of playerIds) {
        if (!scoresMap[playerId]) {
          scoresMap[playerId] = roundData.holes.map(hole => ({
            ...hole,
            strokes: hole.par,
          }));
        }
      }

      setPlayerScores(scoresMap);
    } catch (error) {
      console.error('Failed to load player scores:', error);
      // Fallback: initialiser med par-scores
      const scoresMap: Record<string, HoleScore[]> = {};
      for (const playerId of playerIds) {
        scoresMap[playerId] = roundData.holes.map(hole => ({
          ...hole,
          strokes: hole.par,
        }));
      }
      setPlayerScores(scoresMap);
    }
  };

  const handleScoreChange = (index: number, field: keyof HoleScore, value: number | boolean) => {
    const newScores = [...holeScores];
    newScores[index] = { ...newScores[index], [field]: value };
    setHoleScores(newScores);
  };

  const handlePlayerScoreChange = (
    playerId: string,
    index: number,
    field: keyof HoleScore,
    value: number | boolean
  ) => {
    const newPlayerScores = { ...playerScores };
    const scores = [...(newPlayerScores[playerId] || [])];
    scores[index] = { ...scores[index], [field]: value };
    newPlayerScores[playerId] = scores;
    setPlayerScores(newPlayerScores);
  };

  const handlePlayerSearch = async (query: string) => {
    setPlayerSearchQuery(query);

    if (!query || query.length < 2) {
      setPlayerSearchResults([]);
      return;
    }

    setSearchingPlayers(true);
    try {
      const results = await userService.searchUsers(query);
      const filtered = results.filter(
        user => user.id !== currentUserId && !selectedPlayers.find(p => p.id === user.id)
      );
      setPlayerSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
      setPlayerSearchResults([]);
    } finally {
      setSearchingPlayers(false);
    }
  };

  const handleAddPlayer = (player: UserSearchResult) => {
    setSelectedPlayers([...selectedPlayers, player]);
    setPlayerSearchQuery('');
    setPlayerSearchResults([]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const handleUpdateRound = async () => {
    if (!id || !round) return;

    setSaving(true);
    try {
      // Check if we have multiple players with VALID scores (not all zeros)
      const playersWithValidScores = selectedPlayers.filter(player => {
        const scores = playerScores[player.id] || [];
        const totalStrokes = scores.reduce((sum, h) => sum + (h?.strokes || 0), 0);
        return totalStrokes > 0 && scores.length > 0;
      });

      const hasMultiplePlayers = playersWithValidScores.length > 0;

      if (hasMultiplePlayers) {
        // Only include players with valid scores
        const playerScoresData = [
          {
            playerId: currentUserId!,
            holes: holeScores,
          },
          ...playersWithValidScores.map(player => ({
            playerId: player.id,
            holes: playerScores[player.id],
          })),
        ];

        // Delete old round and create new multi-player round
        await roundService.deleteRound(id);

        // Create new multi-player round
        await roundService.createMultiPlayerRound({
          courseId: round.courseId,
          courseName: round.courseName,
          teeColor: selectedTee,
          numberOfHoles,
          date: round.date,
          playerScores: playerScoresData,
        });
      } else {
        // Single player - use regular update (just update your own scores)
        await roundService.updateRound(id, {
          holes: holeScores,
        });
      }

      // Refresh user data (handicap might have changed)
      try {
        const userData = await userService.getProfile();
        useAuthStore.getState().updateUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }

      const playerCount = playersWithValidScores.length + 1;
      alert(
        `✅ Round updated successfully! ${playerCount} ${
          playerCount === 1 ? 'player' : 'players'
        } updated.`
      );
      navigate('/profile');
    } catch (error) {
      console.error('Failed to update round:', error);
      alert('❌ Failed to update round. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRound = async () => {
    if (!id) return;

    const hasMultiplePlayers = selectedPlayers.length > 0;
    const confirmMessage = hasMultiplePlayers
      ? `⚠️ Are you sure you want to delete this round?\n\nThis will delete the round for ALL ${
          selectedPlayers.length + 1
        } players (you + ${selectedPlayers.length} other${
          selectedPlayers.length > 1 ? 's' : ''
        }).\n\nThis action cannot be undone.`
      : '⚠️ Are you sure you want to delete this round? This action cannot be undone.';

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setDeleting(true);
    try {
      await roundService.deleteRound(id);

      // Refresh user data (handicap will be recalculated)
      try {
        const userData = await userService.getProfile();
        useAuthStore.getState().updateUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }

      const successMessage = hasMultiplePlayers
        ? `✅ Round deleted successfully for all ${selectedPlayers.length + 1} players!`
        : '✅ Round deleted successfully!';
      alert(successMessage);
      navigate('/profile');
    } catch (error) {
      console.error('Failed to delete round:', error);
      alert('❌ Failed to delete round. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading round...</div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Round not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Round</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Round Details</h2>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>{round.courseName}</strong>
            {' • '}
            {selectedTee === 'white' && '⚪ White tee'}
            {selectedTee === 'yellow' && '🟡 Yellow tee'}
            {selectedTee === 'blue' && '🔵 Blue tee'}
            {selectedTee === 'red' && '🔴 Red tee'}
            {' • '}
            {numberOfHoles} holes
            {' • '}
            {new Date(roundDate).toLocaleDateString()}
          </p>
        </div>

        {/* Players in round */}
        {selectedPlayers.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Players in round:
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full text-sm"
                >
                  <span>
                    {player.firstName} {player.lastName}
                  </span>
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add player search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add more players (optional):
          </label>
          <div className="relative">
            <input
              type="text"
              className="input"
              placeholder="Search for users..."
              value={playerSearchQuery}
              onChange={e => handlePlayerSearch(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Search for users who played in the round (minimum 2 characters)
            </p>

            {/* Search results dropdown */}
            {playerSearchQuery.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchingPlayers && (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                )}

                {!searchingPlayers && playerSearchResults.length === 0 && (
                  <div className="p-4 text-center text-gray-500 border border-orange-200 bg-orange-50 m-2 rounded">
                    <p className="font-medium text-orange-800">⚠️ No users found</p>
                    <p className="text-sm text-gray-600 mt-1">
                      The player &quot;{playerSearchQuery}&quot; is not registered in the system.
                      Only registered users can be added to a round.
                    </p>
                  </div>
                )}

                {!searchingPlayers &&
                  playerSearchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddPlayer(user)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Edit Scores</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-2 px-2 sticky left-0 bg-white z-10">Hole</th>
                <th className="text-center py-2 px-2 sticky left-[60px] bg-white z-10">Par</th>
                <th className="text-center py-2 px-2 bg-blue-50">
                  You
                  <div className="text-xs font-normal text-gray-600">
                    {useAuthStore.getState().user?.firstName}
                  </div>
                </th>
                {selectedPlayers.map(player => (
                  <th key={player.id} className="text-center py-2 px-2 bg-green-50">
                    {player.firstName}
                    <div className="text-xs font-normal text-gray-600">{player.lastName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holeScores.map((hole, index) => (
                <tr key={hole.holeNumber} className="border-b">
                  <td className="py-2 px-2 font-semibold sticky left-0 bg-white">
                    Hole {hole.holeNumber}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-600 sticky left-[60px] bg-white">
                    {hole.par}
                  </td>
                  <td className="py-2 px-2 bg-blue-50/30">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      className="w-20 px-2 py-1 border rounded text-center mx-auto block"
                      value={hole.strokes}
                      onChange={e =>
                        handleScoreChange(index, 'strokes', parseInt(e.target.value) || 0)
                      }
                    />
                  </td>
                  {selectedPlayers.map(player => (
                    <td key={player.id} className="py-2 px-2 bg-green-50/30">
                      <input
                        type="number"
                        min={1}
                        max={15}
                        className="w-20 px-2 py-1 border rounded text-center mx-auto block"
                        value={playerScores[player.id]?.[index]?.strokes || 0}
                        onChange={e =>
                          handlePlayerScoreChange(
                            player.id,
                            index,
                            'strokes',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td className="py-3 px-2 sticky left-0 bg-white">Total</td>
                <td className="py-3 px-2 text-center sticky left-[60px] bg-white">
                  {holeScores.reduce((sum, h) => sum + h.par, 0)}
                </td>
                <td className="py-3 px-2 text-center bg-blue-50/30">
                  <div className="flex items-center justify-center gap-2">
                    <span>{holeScores.reduce((sum, h) => sum + h.strokes, 0)}</span>
                    <span className="text-sm text-gray-600">
                      (
                      {holeScores.reduce((sum, h) => sum + h.strokes, 0) -
                        holeScores.reduce((sum, h) => sum + h.par, 0) >
                      0
                        ? '+'
                        : ''}
                      {holeScores.reduce((sum, h) => sum + h.strokes, 0) -
                        holeScores.reduce((sum, h) => sum + h.par, 0)}
                      )
                    </span>
                  </div>
                </td>
                {selectedPlayers.map(player => {
                  const scores = playerScores[player.id] || [];
                  const totalStrokes = scores.reduce((sum, h) => sum + (h?.strokes || 0), 0);
                  const totalPar = scores.reduce((sum, h) => sum + (h?.par || 0), 0);
                  const diff = totalStrokes - totalPar;

                  // Check if scores are valid (not all zeros)
                  const hasValidScores = scores.length > 0 && totalStrokes > 0;

                  return (
                    <td key={player.id} className="py-3 px-2 text-center bg-green-50/30">
                      <div className="flex items-center justify-center gap-2">
                        <span>{totalStrokes}</span>
                        {hasValidScores && (
                          <span className="text-sm text-gray-600">
                            ({diff > 0 ? '+' : ''}
                            {diff})
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p>
            <strong>Note:</strong> Updating scores will recalculate handicaps automatically for all
            players.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={handleDeleteRound}
          disabled={deleting || saving}
          className="btn-outline text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Deleting...' : 'Delete Round'}
        </button>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="btn-outline"
            disabled={saving || deleting}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateRound}
            disabled={saving || deleting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
