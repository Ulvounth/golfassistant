import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { PlusCircle, History, TrendingUp, Trophy } from 'lucide-react';

/**
 * DashboardPage - brukerens dashboard
 */
export function DashboardPage() {
  const user = useAuthStore(state => state.user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Velkommen, {user?.firstName}! 👋</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ditt handicap</p>
              <p className="text-3xl font-bold text-primary-600">{user?.handicap.toFixed(1)}</p>
            </div>
            <TrendingUp className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Runder spilt</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <History className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rangering</p>
              <p className="text-3xl font-bold">-</p>
            </div>
            <Trophy className="text-yellow-600" size={40} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Hurtighandlinger</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/new-round"
            className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <PlusCircle className="text-primary-600" size={32} />
            <div>
              <h3 className="font-semibold text-lg">Registrer ny runde</h3>
              <p className="text-gray-600 text-sm">Legg til en ny golfrunde</p>
            </div>
          </Link>

          <Link
            to="/history"
            className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <History className="text-blue-600" size={32} />
            <div>
              <h3 className="font-semibold text-lg">Se historikk</h3>
              <p className="text-gray-600 text-sm">Oversikt over alle dine runder</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-4">Siste runder</h2>
        <div className="text-center py-12 text-gray-500">
          <p>Du har ikke registrert noen runder ennå.</p>
          <Link to="/new-round" className="btn-primary mt-4 inline-block">
            Registrer din første runde
          </Link>
        </div>
      </div>
    </div>
  );
}
