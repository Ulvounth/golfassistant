import { useAuthStore } from '@/store/authStore';

/**
 * ProfilePage - brukerens profilside
 * (Dette er en placeholder som vil bli utvidet senere)
 */
export function ProfilePage() {
  const user = useAuthStore(state => state.user);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Min profil</h1>

      <div className="card mb-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
            {user?.firstName.charAt(0)}
            {user?.lastName.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-primary-600 font-semibold mt-1">
              Handicap: {user?.handicap.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Om meg</h3>
        <p className="text-gray-600">{user?.bio || 'Ingen bio lagt til ennå.'}</p>

        <div className="mt-6">
          <p className="text-gray-600">Funksjoner som implementeres:</p>
          <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
            <li>Rediger profilinformasjon</li>
            <li>Last opp profilbilde til S3</li>
            <li>Oppdater bio</li>
            <li>Handicap-historikk graf</li>
            <li>Personlige statistikker</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
