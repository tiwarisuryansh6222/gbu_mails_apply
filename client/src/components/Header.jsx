import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FileText, LayoutDashboard } from 'lucide-react';

export default function Header({ theme, onToggleTheme }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-brand" onClick={() => navigate('/')}>
        <div className="brand-icon">⚡</div>
        <span className="brand-text">Placement Filter</span>
      </div>

      {currentUser && (
        <nav className="header-nav">
          <button
            className={`header-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Home size={15} /> Home
          </button>
          <button
            className={`header-nav-link ${isActive('/parse') ? 'active' : ''}`}
            onClick={() => navigate('/parse')}
          >
            <FileText size={15} /> Parse
          </button>
          <button
            className={`header-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={15} /> Dashboard
          </button>
        </nav>
      )}

      <div className="header-actions">
        {currentUser && (
          <div className="header-user">
            <img src={currentUser.photoURL} alt="" />
            <span>{currentUser.displayName?.split(' ')[0]}</span>
          </div>
        )}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
