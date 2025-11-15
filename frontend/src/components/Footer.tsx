/**
 * Footer-komponent
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">⛳ GolfTracker</h3>
            <p className="text-gray-400">
              Din digitale golfassistent for å registrere runder og følge handicap.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Lenker</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  Om oss
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Personvern
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Følg oss</h4>
            <div className="flex space-x-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Facebook
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} GolfTracker. Alle rettigheter reservert.</p>
        </div>
      </div>
    </footer>
  );
}
