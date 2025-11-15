/**
 * RoundHistoryPage - oversikt over alle runder
 * (Dette er en placeholder som vil bli utvidet senere)
 */
export function RoundHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Runde-historikk</h1>
      <div className="card">
        <p className="text-gray-600">
          Her vil du se en oversikt over alle dine registrerte golfrunder.
        </p>
        <p className="text-gray-600 mt-4">Funksjoner som implementeres:</p>
        <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
          <li>Liste over alle runder sortert etter dato</li>
          <li>Filtreringsmuligheter (dato, bane, score)</li>
          <li>Redigere eksisterende runder</li>
          <li>Slette runder</li>
          <li>Statistikk og grafer</li>
        </ul>
      </div>
    </div>
  );
}
