/**
 * NewRoundPage - side for å registrere ny golfrunde
 * (Dette er en placeholder som vil bli utvidet senere)
 */
export function NewRoundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Registrer ny runde</h1>
      <div className="card">
        <p className="text-gray-600">
          Denne siden vil inneholde et skjema for å registrere en ny golfrunde.
        </p>
        <p className="text-gray-600 mt-4">Funksjoner som implementeres:</p>
        <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
          <li>Velg golfbane fra database</li>
          <li>Velg tee-farge (white, yellow, blue, red)</li>
          <li>Velg antall hull (9 eller 18)</li>
          <li>Registrer score per hull + fairway/green/putts</li>
          <li>Automatisk beregning av handicap</li>
        </ul>
      </div>
    </div>
  );
}
