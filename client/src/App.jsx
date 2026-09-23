import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLocalStorage } from './hooks/useLocalStorage';

import Home from './pages/Home';
import Parse from './pages/Parse';
import Dashboard from './pages/Dashboard';
import ParticleDrift from './components/ui/particle-drift';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const [theme, setTheme] = useLocalStorage('placement_filter_theme', 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <>
      <ParticleDrift 
        mode={theme} 
        className="fixed inset-0 w-full h-full z-[-1] pointer-events-none" 
        opacity={0.75} 
      />
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home theme={theme} onToggleTheme={toggleTheme} />} />
          <Route 
            path="/parse" 
            element={
              <ProtectedRoute>
                <Parse theme={theme} onToggleTheme={toggleTheme} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard theme={theme} onToggleTheme={toggleTheme} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </>
  );
}
