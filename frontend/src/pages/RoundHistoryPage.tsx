/**
 * RoundHistoryPage - overview of all rounds
 * (This is a placeholder that will be expanded later)
 */
export function RoundHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Round History</h1>
      <div className="card">
        <p className="text-gray-600">
          Here you will see an overview of all your registered golf rounds.
        </p>
        <p className="text-gray-600 mt-4">Features to be implemented:</p>
        <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
          <li>List of all rounds sorted by date</li>
          <li>Filtering options (date, course, score)</li>
          <li>Edit existing rounds</li>
          <li>Delete rounds</li>
          <li>Statistics and graphs</li>
        </ul>
      </div>
    </div>
  );
}
