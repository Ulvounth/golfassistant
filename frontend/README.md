# GolfTracker Frontend

React-based frontend for the GolfTracker app.

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at <http://localhost:3000>

### Build for production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```text
src/
├── components/          # Reusable components
│   ├── Layout.tsx       # Main layout with navbar and footer
│   ├── Navbar.tsx       # Navigation menu
│   ├── Footer.tsx       # Footer
│   └── ProtectedRoute.tsx  # Route guard for authentication
├── pages/               # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── NewRoundPage.tsx
│   ├── RoundHistoryPage.tsx
│   ├── ProfilePage.tsx
│   └── LeaderboardPage.tsx
├── services/            # API calls
│   ├── authService.ts
│   ├── roundService.ts
│   ├── userService.ts
│   ├── courseService.ts
│   └── leaderboardService.ts
├── store/               # Global state with Zustand
│   └── authStore.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── lib/                 # Utilities and configurations
│   └── axios.ts         # Axios configuration with interceptors
├── App.tsx              # Main component with routing
├── main.tsx             # Entry point
└── index.css            # Global styling with Tailwind
```

## 🎨 Styling

The app uses Tailwind CSS for styling. Custom classes:

- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline` - Buttons
- `.input` - Input fields
- `.card` - Container with shadow

## 🔐 Authentication

JWT-based authentication with Zustand state management.

- Token stored in localStorage
- Automatically included in all API calls via Axios interceptor
- ProtectedRoute component protects private routes

## 📡 API Integration

All API calls go through the services folder. Base URL is set in `.env`:

```bash
VITE_API_URL=http://localhost:3001
```

## 🛠️ Technologies

- React 18
- TypeScript
- Tailwind CSS
- React Router v6
- Zustand (state management)
- Axios (HTTP client)
- Vite (build tool)
- Lucide React (icons)
