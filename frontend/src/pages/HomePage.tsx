import { Link } from 'react-router-dom';
import { TrendingUp, Users, Award, Target } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * HomePage - landingsside
 */
export function HomePage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Din digitale <span className="text-primary-600">golfassistent</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Registrer runder, følg handicap, og konkurrer med venner. GolfTracker gjør det enkelt å
          holde oversikt over din golfprogresjon.
        </p>
        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Kom i gang gratis
            </Link>
            <Link to="/login" className="btn-outline text-lg px-8 py-3">
              Logg inn
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Funksjoner</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Automatisk handicap</h3>
            <p className="text-gray-600">
              Appen beregner automatisk handicap basert på dine registrerte runder.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Target className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Detaljert statistikk</h3>
            <p className="text-gray-600">
              Registrer score per hull, fairways, greens in regulation og putter.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Users className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
            <p className="text-gray-600">
              Se hvordan du rangerer mot andre spillere på leaderboardet.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Award className="text-primary-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Historikk</h3>
            <p className="text-gray-600">
              Full oversikt over alle dine tidligere runder og din utvikling.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - Only show if not authenticated */}
      {!isAuthenticated && (
        <section className="bg-primary-600 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Klar til å starte?</h2>
            <p className="text-xl mb-8">
              Bli med i fellesskapet og begynn å spore din golfprogresjon i dag!
            </p>
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Registrer deg nå
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
