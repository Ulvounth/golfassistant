import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { roundService } from '@/services/roundService';
import { userService } from '@/services/userService';
import { GolfRound } from '@/types';

/**
 * ProfilePage - brukerens profilside med runde-historikk
 */
export function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Hent oppdatert brukerdata
      const userData = await userService.getProfile();
      updateUser(userData);

      // Hent runder
      const roundsData = await roundService.getRounds();
      setRounds(roundsData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
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
    if (diff <= -2) return 'text-blue-600 font-bold'; // Eagle or better
    if (diff === -1) return 'text-green-600 font-semibold'; // Birdie
    if (diff === 0) return 'text-gray-700'; // Par
    if (diff === 1) return 'text-orange-600'; // Bogey
    return 'text-red-600'; // Double bogey or worse
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="card mb-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
            {user?.firstName.charAt(0)}
            {user?.lastName.charAt(0)}
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
                  <div>
                    <h4 className="font-semibold text-lg">{round.courseName}</h4>
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
                    <span className="font-medium">👥 Played with:</span>
                    <span className="ml-1">
                      {round.players.length} {round.players.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                )}
              </div>
            ))}

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
