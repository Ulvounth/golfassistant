# GolfTracker Frontend

React-basert frontend for GolfTracker-appen.

## 🚀 Kom i gang

### Installasjon

```bash
npm install
```

### Utvikling

```bash
npm run dev
```

Åpner appen på http://localhost:3000

### Bygg for produksjon

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## 📁 Prosjektstruktur

```
src/
├── components/          # Gjenbrukbare komponenter
│   ├── Layout.tsx       # Hovedlayout med navbar og footer
│   ├── Navbar.tsx       # Navigasjonsmeny
│   ├── Footer.tsx       # Footer
│   └── ProtectedRoute.tsx  # Route guard for autentisering
├── pages/               # Sidekomponenter
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── NewRoundPage.tsx
│   ├── RoundHistoryPage.tsx
│   ├── ProfilePage.tsx
│   └── LeaderboardPage.tsx
├── services/            # API-kall
│   ├── authService.ts
│   ├── roundService.ts
│   ├── userService.ts
│   ├── courseService.ts
│   └── leaderboardService.ts
├── store/               # Global state med Zustand
│   └── authStore.ts
├── types/               # TypeScript type-definisjoner
│   └── index.ts
├── lib/                 # Utilities og konfigurasjoner
│   └── axios.ts         # Axios-konfigurasjon med interceptors
├── App.tsx              # Hovedkomponent med routing
├── main.tsx             # Entry point
└── index.css            # Global styling med Tailwind
```

## 🎨 Styling

Appen bruker Tailwind CSS for styling. Egendefinerte klasser:

- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline` - Knapper
- `.input` - Input-felt
- `.card` - Container med shadow

## 🔐 Autentisering

JWT-basert autentisering med Zustand state management.

- Token lagres i localStorage
- Automatisk inkludert i alle API-kall via Axios interceptor
- ProtectedRoute-komponent beskytter private ruter

## 📡 API Integration

Alle API-kall går via services-mappen. Base URL settes i `.env`:

```
VITE_API_URL=http://localhost:3001
```

## 🛠️ Teknologier

- React 18
- TypeScript
- Tailwind CSS
- React Router v6
- Zustand (state management)
- Axios (HTTP client)
- Vite (build tool)
- Lucide React (ikoner)
