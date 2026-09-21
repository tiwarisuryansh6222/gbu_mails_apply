import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, LogIn, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';

export default function Home({ theme, onToggleTheme }) {
  const { currentUser, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError('');
      const user = await loginWithGoogle();
      if (user) {
        navigate('/parse');
      }
    } catch (error) {
      console.error(error);
      setLoginError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (authMode === 'signup' && !displayName.trim()) return;

    try {
      setIsLoggingIn(true);
      setLoginError('');
      let user;

      if (authMode === 'signup') {
        user = await signUpWithEmail(email, password, displayName.trim());
      } else {
        user = await loginWithEmail(email, password);
      }

      if (user) {
        navigate('/parse');
      }
    } catch (error) {
      console.error(error);
      setLoginError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const switchMode = () => {
    setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin');
    setLoginError('');
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
            <h2>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
            <p>{authMode === 'signin' 
              ? 'Sign in to start tracking your applications securely.' 
              : 'Create a new account to get started.'}
            </p>

            {loginError && (
              <div style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="auth-form">
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={isLoggingIn}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoggingIn}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: 'var(--text-secondary)', display: 'flex', alignItems: 'center'
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={isLoggingIn}
                style={{ width: '100%', opacity: isLoggingIn ? 0.7 : 1, cursor: isLoggingIn ? 'not-allowed' : 'pointer' }}
              >
                {isLoggingIn ? (
                  <>Loading...</>
                ) : authMode === 'signin' ? (
                  <><LogIn size={18} /> Sign In</>
                ) : (
                  <><UserPlus size={18} /> Create Account</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>or</span>
            </div>

            {/* Google Sign-In Button */}
            <button
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              style={{ width: '100%', opacity: isLoggingIn ? 0.7 : 1, cursor: isLoggingIn ? 'not-allowed' : 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            {/* Toggle sign-in / sign-up */}
            <p className="auth-switch">
              {authMode === 'signin' ? (
                <>Don't have an account? <button type="button" onClick={switchMode} className="auth-switch-btn">Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={switchMode} className="auth-switch-btn">Sign in</button></>
              )}
            </p>
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
