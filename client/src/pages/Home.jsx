import React from 'react';
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
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <main className="home-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to God Bless You App
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '3rem', lineHeight: '1.6' }}>
          The ultimate placement portal for engineering students. Parse your college placement emails in seconds and track your applications all in one place.
        </p>

        {!currentUser ? (
          <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '400px', width: '100%' }}>
            <Briefcase size={48} color="var(--primary-color)" />
            <h2>Get Started Now</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in with your Google account to start tracking your applications securely.</p>
            <button className="primary-btn" onClick={handleLogin} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '1rem' }}>
              <LogIn size={20} />
              Sign in with Google
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '800px' }}>
            
            <div className="glass-panel" onClick={() => navigate('/parse')} style={{ flex: '1 1 300px', padding: '2.5rem', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
                <Mail size={40} />
              </div>
              <h2 style={{ margin: '0' }}>Parse Mails</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0' }}>Extract job details from "God Bless You" emails instantly.</p>
              <div style={{ marginTop: 'auto', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                Open Parser <ArrowRight size={18} />
              </div>
            </div>

            <div className="glass-panel" onClick={() => navigate('/dashboard')} style={{ flex: '1 1 300px', padding: '2.5rem', cursor: 'pointer', transition: 'transform 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1.5rem', borderRadius: '50%', color: '#a855f7' }}>
                <Briefcase size={40} />
              </div>
              <h2 style={{ margin: '0' }}>My Applications</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0' }}>Track your applied companies, interview rounds, and statuses.</p>
              <div style={{ marginTop: 'auto', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                Open Dashboard <ArrowRight size={18} />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
