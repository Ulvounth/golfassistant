/**
 * LeaderboardPage - leaderboard basert på handicap
 * (Dette er en placeholder som vil bli utvidet senere)
 */
export function LeaderboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">🏆 Leaderboard</h1>

      <div className="card">
        <p className="text-gray-600">
          Her vil du se en rangering av alle spillere basert på handicap.
        </p>
        <p className="text-gray-600 mt-4">Funksjoner som implementeres:</p>
        <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
          <li>Liste over spillere sortert etter handicap</li>
          <li>Profilbilder og navn</li>
          <li>Antall runder spilt</li>
          <li>Fremhev innlogget bruker</li>
          <li>Filtreringsmuligheter</li>
        </ul>
      </div>
    </div>
  );
}
