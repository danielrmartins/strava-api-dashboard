import { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

interface AuthStatus {
  authenticated: boolean;
  athlete_name?: string;
  athlete_username?: string;
}

export function App() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);

  useEffect(() => {
    fetch('/auth/status')
      .then((r) => r.json())
      .then((data: AuthStatus) => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  if (auth === null) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!auth.authenticated) {
    const params = new URLSearchParams(window.location.search);
    return <Login error={params.get('error') ?? undefined} />;
  }

  return <Dashboard athleteName={auth.athlete_name} />;
}
