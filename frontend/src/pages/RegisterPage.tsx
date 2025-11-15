import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

/**
 * RegisterPage - registreringsside
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validering
    if (formData.password !== formData.confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passordet må være minst 8 tegn');
      return;
    }

    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);
      login(response.user, response.token);
      navigate('/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registrering feilet. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="card">
          <h2 className="text-3xl font-bold text-center mb-8">Registrer deg</h2>

          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Fornavn
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className="input"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Etternavn
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  className="input"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="din@email.no"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passord (min. 8 tegn)
              </label>
              <input
                id="password"
                type="password"
                required
                className="input"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bekreft passord
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="input"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'Registrerer...' : 'Registrer deg'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Har du allerede en konto?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Logg inn her
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
