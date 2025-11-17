import { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { courseService } from '@/services/courseService';
import { roundService } from '@/services/roundService';
import { userService, UserSearchResult } from '@/services/userService';
import { GolfCourse, HoleScore } from '@/types';
import { AddCourseModal } from '@/components/AddCourseModal';

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
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerSearchResults, setPlayerSearchResults] = useState<UserSearchResult[]>([]);
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [step, setStep] = useState(1); // 1: Select course/details, 2: Enter scores
  const [holeScores, setHoleScores] = useState<HoleScore[]>([]);
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
    alert(`✅ Bane "${courseName}" lagt til!`);
  };

  const handleProceedToScoring = () => {
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return;

    // Get the holes to play based on selection
    const startHole = numberOfHoles === 9 && whichNine === 'back' ? 9 : 0;
    const endHole = startHole + numberOfHoles;
    const holesToPlay = selectedCourse.holes.slice(startHole, endHole);

    // Initialize hole scores
    const initialScores: HoleScore[] = holesToPlay.map(hole => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      strokes: hole.par, // Default to par
      fairwayHit: false, // Not used in UI, but required by type
      greenInRegulation: false, // Not used in UI, but required by type
      putts: 0, // Not used in UI, but required by type
    }));

    setHoleScores(initialScores);
    setStep(2);
  };

  const handleScoreChange = (index: number, field: keyof HoleScore, value: number | boolean) => {
    const newScores = [...holeScores];
    newScores[index] = { ...newScores[index], [field]: value };
    setHoleScores(newScores);
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
      // Filter out current user and already selected players
      const currentUserId = useAuthStore.getState().user?.id;
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

  const handleSubmitRound = async () => {
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse) return;

    setSaving(true);
    try {
      // Kombiner dato med tidspunkt for ISO string
      const dateTime = new Date(roundDate + 'T12:00:00.000Z').toISOString();

      await roundService.createRound({
        courseId: selectedCourseId,
        courseName: selectedCourse.name,
        teeColor: selectedTee,
        numberOfHoles,
        date: dateTime,
        players: selectedPlayers.map(p => p.id), // Extract just the IDs
        holes: holeScores,
      });

      // Hent oppdatert brukerdata (med nytt handicap)
      try {
        const userData = await userService.getProfile();
        useAuthStore.getState().updateUser(userData);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }

      alert('✅ Runde lagret!');
      navigate('/profile'); // Navigate to profile/rounds page
    } catch (error) {
      console.error('Failed to save round:', error);
      alert('❌ Kunne ikke lagre runde. Prøv igjen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Registrer ny runde</h1>

      {/* Step 1: Course selection and details */}
      {step === 1 && (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">1. Velg golfbane</h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                className="input"
                placeholder="Søk etter bane..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>

            {/* Course list */}
            {loading ? (
              <p className="text-gray-600">Laster baner...</p>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Ingen baner funnet' : 'Ingen baner i databasen ennå'}
                </p>
                <button
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PlusCircle size={20} />
                  Legg til din første bane
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
                  Banen din er ikke i listen? Legg den til her
                </button>
              </>
            )}
          </div>

          {selectedCourseId && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">2. Velg runde-detaljer</h2>

              {/* Tee selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hvilken tee spilte du?
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
                        {tee === 'white' && '⚪ Hvit'}
                        {tee === 'yellow' && '🟡 Gul'}
                        {tee === 'blue' && '🔵 Blå'}
                        {tee === 'red' && '🔴 Rød'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Number of holes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hvor mange hull spilte du?
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
                    18 hull
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={9}
                      checked={numberOfHoles === 9}
                      onChange={() => setNumberOfHoles(9)}
                      className="mr-2"
                    />
                    9 hull
                  </label>
                </div>
              </div>

              {/* Front 9 vs Back 9 - only shown for 9 holes */}
              {numberOfHoles === 9 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hvilke 9 hull?
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
                      Front 9 (hull 1-9)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="back"
                        checked={whichNine === 'back'}
                        onChange={() => setWhichNine('back')}
                        className="mr-2"
                      />
                      Back 9 (hull 10-18)
                    </label>
                  </div>
                </div>
              )}

              {/* Date picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Når spilte du runden?
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hvem spilte med? (valgfritt)
                </label>

                {/* Selected players */}
                {selectedPlayers.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                      >
                        <span>
                          {player.firstName} {player.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(player.id)}
                          className="hover:text-primary-900"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    className="input"
                    placeholder="Søk etter brukere..."
                    value={playerSearchQuery}
                    onChange={e => handlePlayerSearch(e.target.value)}
                  />

                  {/* Search results dropdown */}
                  {playerSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {playerSearchResults.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleAddPlayer(user)}
                          className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                        >
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Handicap: {user.handicap.toFixed(1)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchingPlayers && (
                    <div className="absolute right-3 top-3 text-gray-400">Søker...</div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Søk etter brukere som var med på runden (minimum 2 tegn)
                </p>
              </div>

              {/* Next step button */}
              <div className="flex justify-end">
                <button onClick={handleProceedToScoring} className="btn-primary">
                  Neste: Registrer score
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
            <h2 className="text-xl font-semibold">2. Registrer score</h2>
            <button onClick={() => setStep(1)} className="btn-outline text-sm">
              ← Tilbake
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>{courses.find(c => c.id === selectedCourseId)?.name}</strong>
              {' • '}
              {selectedTee === 'white' && '⚪ Hvit tee'}
              {selectedTee === 'yellow' && '🟡 Gul tee'}
              {selectedTee === 'blue' && '🔵 Blå tee'}
              {selectedTee === 'red' && '🔴 Rød tee'}
              {' • '}
              {numberOfHoles} hull
              {numberOfHoles === 9 && ` (${whichNine === 'front' ? 'Front 9' : 'Back 9'})`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-2 px-2">Hull</th>
                  <th className="text-center py-2 px-2">Par</th>
                  <th className="text-center py-2 px-2">Slag</th>
                </tr>
              </thead>
              <tbody>
                {holeScores.map((hole, index) => (
                  <tr key={hole.holeNumber} className="border-b">
                    <td className="py-2 px-2 font-semibold">Hull {hole.holeNumber}</td>
                    <td className="py-2 px-2 text-center text-gray-600">{hole.par}</td>
                    <td className="py-2 px-2">
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
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-3 px-2">Total</td>
                  <td className="py-3 px-2 text-center">
                    {holeScores.reduce((sum, h) => sum + h.par, 0)}
                  </td>
                  <td className="py-3 px-2 text-center">
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
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p>
              <strong>Tips:</strong> Registrer antall slag du brukte på hvert hull.
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSubmitRound}
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Lagrer...' : 'Lagre runde'}
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
