import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, LogIn, ArrowRight } from 'lucide-react';
import Header from '../components/Header';

export default function Home({ theme, onToggleTheme }) {
  const { currentUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Animated background orbs */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <main className="home-main">
        <h1 className="hero-title">
          Welcome to God Bless You App
        </h1>
        <p className="hero-subtitle">
          The ultimate placement portal for engineering students. Parse your college placement emails in seconds and track your applications — all in one place.
        </p>

        {!currentUser ? (
          <div className="glass-panel hero-login-card">
            <div className="hero-login-icon">
              <Briefcase size={36} />
            </div>
            <h2>Get Started Now</h2>
            <p>Sign in with your Google account to start tracking your applications securely.</p>
            <button className="primary-btn" onClick={handleLogin}>
              <LogIn size={20} />
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="feature-cards">
            
            <div className="glass-panel feature-card" onClick={() => navigate('/parse')}>
              <div className="feature-card-icon indigo">
                <Mail size={32} />
              </div>
              <h2>Parse Mails</h2>
              <p>Extract job details from "God Bless You" emails instantly using AI.</p>
              <div className="feature-card-cta indigo">
                Open Parser <ArrowRight size={18} />
              </div>
            </div>

            <div className="glass-panel feature-card" onClick={() => navigate('/dashboard')}>
              <div className="feature-card-icon purple">
                <Briefcase size={32} />
              </div>
              <h2>My Applications</h2>
              <p>Track your applied companies, interview rounds, and placement statuses.</p>
              <div className="feature-card-cta purple">
                Open Dashboard <ArrowRight size={18} />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
