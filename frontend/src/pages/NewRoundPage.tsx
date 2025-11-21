import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { courseService } from '@/services/courseService';
import { roundService } from '@/services/roundService';
import { userService, UserSearchResult } from '@/services/userService';
import { GolfCourse, HoleScore } from '@/types';
import { AddCourseModal } from '@/components/AddCourseModal';
import { PlayerSearch } from '@/components/PlayerSearch';
import { TeeColorBadge } from '@/components/TeeColorBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * NewRoundPage - side for å registrere ny golfrunde
 */
export function NewRoundPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTee, setSelectedTee] = useState<'white' | 'yellow' | 'blue' | 'red'>('yellow');
  const [numberOfHoles, setNumberOfHoles] = useState<9 | 18>(18);
  const [whichNine, setWhichNine] = useState<'front' | 'back'>('front');
  const [roundDate, setRoundDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [selectedPlayers, setSelectedPlayers] = useState<UserSearchResult[]>([]);
  const [step, setStep] = useState(1); // 1: Select course/details, 2: Enter scores
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]); // Your own scores
  const [playerScores, setPlayerScores] = useState<Record<string, HoleScore[]>>({}); // Scores for other players: playerId -> HoleScore[]
  const [saving, setSaving] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect til login hvis ikke autentisert
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/new-round');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query) {
      loadCourses();
      return;
    }
    try {
      const results = await courseService.searchCourses(query);
      setCourses(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCourseAdded = (courseId: string, courseName: string) => {
    setSelectedCourseId(courseId);
    loadCourses(); // Refresh course list
    toast.success(`Course "${courseName}" added!`);
  };

  const handleProceedToScoring = () => {
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return;

    // Get the holes to play based on selection
    const startHole = numberOfHoles === 9 && whichNine === 'back' ? 9 : 0;
    const endHole = startHole + numberOfHoles;
    const holesToPlay = selectedCourse.holes.slice(startHole, endHole);

    // Initialize hole scores for yourself
    const initialScores: HoleScore[] = holesToPlay.map(hole => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      strokes: hole.par, // Default to par
      fairwayHit: false, // Not used in UI, but required by type
      greenInRegulation: false, // Not used in UI, but required by type
      putts: 0, // Not used in UI, but required by type
    }));

    setHoleScores(initialScores);

    // Initialize hole scores for other players
    const initialPlayerScores: Record<string, HoleScore[]> = {};
    selectedPlayers.forEach(player => {
      initialPlayerScores[player.id] = holesToPlay.map(hole => ({
        holeNumber: hole.holeNumber,
        par: hole.par,
        strokes: hole.par, // Default to par
        fairwayHit: false,
        greenInRegulation: false,
        putts: 0,
      }));
    });
    setPlayerScores(initialPlayerScores);

    setStep(2);
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

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== playerId));
  };

  const handleSubmitRound = async () => {
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return;

    const currentUserId = useAuthStore.getState().user?.id;
    if (!currentUserId) return;

    setSaving(true);
    try {
      // Kombiner dato med tidspunkt for ISO string
      const dateTime = new Date(roundDate + 'T12:00:00.000Z').toISOString();

      // Prepare player scores array including yourself
      const playerScoresData = [
        {
          playerId: currentUserId,
          holes: holeScores,
        },
        ...selectedPlayers.map(player => ({
          playerId: player.id,
          holes: playerScores[player.id] || [],
        })),
      ];

      // Use multi-player API to create rounds for all players
      await roundService.createMultiPlayerRound({
        courseId: selectedCourseId,
        courseName: selectedCourse.name,
        teeColor: selectedTee,
        numberOfHoles,
        date: dateTime,
        playerScores: playerScoresData,
      });

      // Refresh user data (with new handicap)
      try {
        const userData = await userService.getProfile();
        useAuthStore.getState().updateUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }

      const playerCount = selectedPlayers.length + 1; // +1 for yourself
      toast.success(
        `Round saved successfully! ${playerCount} ${
          playerCount === 1 ? 'player' : 'players'
        } registered.`
      );
      navigate('/profile');
    } catch (error) {
      console.error('Failed to save round:', error);
      toast.error('Failed to save round. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Register New Round</h1>

      {/* Step 1: Course selection and details */}
      {step === 1 && (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">1. Select Golf Course</h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                className="input"
                placeholder="Search for course..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>

            {/* Course list */}
            {loading ? (
              <LoadingSpinner message="Loading courses..." />
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'No courses found' : 'No courses in database yet'}
                </p>
                <button
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PlusCircle size={20} />
                  Add your first course
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {courses.map(course => (
                    <label
                      key={course.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedCourseId === course.id ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="course"
                        value={course.id}
                        checked={selectedCourseId === course.id}
                        onChange={() => setSelectedCourseId(course.id)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold">{course.name}</p>
                        <p className="text-sm text-gray-600">{course.location}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="btn-outline inline-flex items-center gap-2 w-full justify-center"
                >
                  <PlusCircle size={20} />
                  Course not in the list? Add it here
                </button>
              </>
            )}
          </div>

          {selectedCourseId && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">2. Select Round Details</h2>

              {/* Tee selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which tee did you play?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['white', 'yellow', 'blue', 'red'] as const).map(tee => (
                    <label
                      key={tee}
                      className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedTee === tee ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="tee"
                        value={tee}
                        checked={selectedTee === tee}
                        onChange={() => setSelectedTee(tee)}
                        className="sr-only"
                      />
                      <span className="font-medium capitalize">
                        {tee === 'white' && '⚪ White'}
                        {tee === 'yellow' && '🟡 Yellow'}
                        {tee === 'blue' && '🔵 Blue'}
                        {tee === 'red' && '🔴 Red'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Number of holes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many holes did you play?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={18}
                      checked={numberOfHoles === 18}
                      onChange={() => setNumberOfHoles(18)}
                      className="mr-2"
                    />
                    18 holes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={9}
                      checked={numberOfHoles === 9}
                      onChange={() => setNumberOfHoles(9)}
                      className="mr-2"
                    />
                    9 holes
                  </label>
                </div>
              </div>

              {/* Front 9 vs Back 9 - only shown for 9 holes */}
              {numberOfHoles === 9 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which 9 holes?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="front"
                        checked={whichNine === 'front'}
                        onChange={() => setWhichNine('front')}
                        className="mr-2"
                      />
                      Front 9 (holes 1-9)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="back"
                        checked={whichNine === 'back'}
                        onChange={() => setWhichNine('back')}
                        className="mr-2"
                      />
                      Back 9 (holes 10-18)
                    </label>
                  </div>
                </div>
              )}

              {/* Date picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When did you play the round?
                </label>
                <input
                  type="date"
                  className="input max-w-xs"
                  value={roundDate}
                  max={new Date().toISOString().split('T')[0]} // Can't select future dates
                  onChange={e => setRoundDate(e.target.value)}
                />
              </div>

              {/* Players selector */}
              <PlayerSearch
                selectedPlayers={selectedPlayers}
                onAddPlayer={player => setSelectedPlayers([...selectedPlayers, player])}
                onRemovePlayer={handleRemovePlayer}
                currentUserId={useAuthStore.getState().user?.id}
              />

              {/* Next step button */}
              <div className="flex justify-end">
                <button onClick={handleProceedToScoring} className="btn-primary">
                  Next: Enter Scores
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Step 2: Score entry */}
      {step === 2 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">2. Enter Scores</h2>
            <button onClick={() => setStep(1)} className="btn-outline text-sm">
              ← Back
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>{courses.find(c => c.id === selectedCourseId)?.name}</strong>
              {' • '}
              <TeeColorBadge color={selectedTee} />
              {' • '}
              {numberOfHoles} holes
              {numberOfHoles === 9 && ` (${whichNine === 'front' ? 'Front 9' : 'Back 9'})`}
            </p>
          </div>

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
                    const totalStrokes = scores.reduce((sum, h) => sum + h.strokes, 0);
                    const totalPar = scores.reduce((sum, h) => sum + h.par, 0);
                    const diff = totalStrokes - totalPar;
                    return (
                      <td key={player.id} className="py-3 px-2 text-center bg-green-50/30">
                        <div className="flex items-center justify-center gap-2">
                          <span>{totalStrokes}</span>
                          <span className="text-sm text-gray-600">
                            ({diff > 0 ? '+' : ''}
                            {diff})
                          </span>
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
              <strong>Tip:</strong> Enter the number of strokes each player took on each hole.
              {selectedPlayers.length > 0 && (
                <span className="block mt-2 text-green-700">
                  ✅ All players' scores will be saved and their handicaps will be updated
                  automatically.
                </span>
              )}
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSubmitRound}
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Round'}
            </button>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        onCourseAdded={handleCourseAdded}
      />
    </div>
  );
}
