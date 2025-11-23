import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Navbar-komponent med navigasjon og brukerinfo
 */
export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getLinkClass = (path: string) => {
    return isActive(path)
      ? 'text-primary-600 bg-primary-100 px-4 py-2 rounded-lg font-medium'
      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg font-medium transition-all';
  };

  const getMobileLinkClass = (path: string) => {
    return isActive(path)
      ? 'block px-4 py-2.5 text-primary-600 bg-primary-100 rounded-lg font-medium'
      : 'block px-4 py-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg font-medium transition-all';
  };

  return (
    <nav className="bg-white shadow-lg border-b-4 border-primary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">⛳ GolfTracker</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/new-round" className={getLinkClass('/new-round')}>
                  New Round
                </Link>
                <Link to="/courses" className={getLinkClass('/courses')}>
                  Courses
                </Link>
                <Link to="/leaderboard" className={getLinkClass('/leaderboard')}>
                  Leaderboard
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 ${getLinkClass('/profile')}`}
                >
                  <User size={20} />
                  <span>{user?.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-all"
                >
                  <LogOut size={20} />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClass('/login')}>
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-all"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={getMobileLinkClass('/dashboard')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/new-round"
                  className={getMobileLinkClass('/new-round')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  New Round
                </Link>
                <Link
                  to="/courses"
                  className={getMobileLinkClass('/courses')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Courses
                </Link>
                <Link
                  to="/leaderboard"
                  className={getMobileLinkClass('/leaderboard')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                <Link
                  to="/profile"
                  className={getMobileLinkClass('/profile')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={getMobileLinkClass('/login')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center rounded-lg font-semibold shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
