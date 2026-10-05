import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, LogIn, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import FilterBar from '../components/FilterBar';
import ResultsView from '../components/ResultsView';
import DraftMailModal from '../components/DraftMailModal';
import Spinner from '../components/Spinner';

const DEFAULT_FILTERS = {
  workModes: [],
  employmentTypes: [],
  batches: [],
  includeUnspecifiedBatch: true,
  searchText: '',
};

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

  // Jobs state
  const [globalJobs, setGlobalJobs] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [draftMailJob, setDraftMailJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoadingJobs(true);
      const q = query(collection(db, 'global_jobs'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalJobs(jobs);
        setLoadingJobs(false);
      }, (error) => {
        console.error("Error fetching global jobs with orderBy, falling back:", error);
        // Fallback without orderBy in case of missing index
        const fallbackQ = query(collection(db, 'global_jobs'));
        onSnapshot(fallbackQ, (fallbackSnap) => {
          const jobs = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          jobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setGlobalJobs(jobs);
          setLoadingJobs(false);
        });
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const filteredResults = useMemo(() => {
    if (!globalJobs) return null;
    return globalJobs.filter((job) => {
      if (filters.workModes.length > 0 && !filters.workModes.includes(job.work_mode)) return false;
      if (filters.employmentTypes.length > 0 && !filters.employmentTypes.includes(job.employment_type)) return false;
      
      if (filters.batches.length > 0) {
        const jobBatches = job.eligible_batches || [];
        if (jobBatches.length === 0) {
          if (!filters.includeUnspecifiedBatch) return false;
        } else {
          if (!jobBatches.some((b) => filters.batches.includes(b))) return false;
        }
      } else if (!filters.includeUnspecifiedBatch) {
        if ((job.eligible_batches || []).length === 0) return false;
      }

      if (filters.searchText.trim()) {
        const searchQ = filters.searchText.toLowerCase();
        const companyMatch = (job.company || '').toLowerCase().includes(searchQ);
        const roleMatch = (job.role || '').toLowerCase().includes(searchQ);
        if (!companyMatch && !roleMatch) return false;
      }

      return true;
    });
  }, [globalJobs, filters]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError('');
      const user = await loginWithGoogle();
      if (user) {
        navigate('/dashboard');
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
        navigate('/dashboard');
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
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <main className="home-main">
        <h1 className="hero-title" style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
          Apply to your next<br />dream job
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
          Find the best opportunities curated for you, filter by your preferences, and track your applications instantly.
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

            <div className="auth-divider">
              <span>or</span>
            </div>

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

            <p className="auth-switch">
              {authMode === 'signin' ? (
                <>Don't have an account? <button type="button" onClick={switchMode} className="auth-switch-btn">Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={switchMode} className="auth-switch-btn">Sign in</button></>
              )}
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>God Bless You Mails</h2>
                {globalJobs.length > 0 && (
                  <button 
                    className="secondary-btn" 
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                )}
              </div>
              {loadingJobs ? (
                <Spinner />
              ) : globalJobs.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No jobs posted yet.</p>
                </div>
              ) : (
                <div className="results-layout" style={{ marginTop: 0 }}>
                  {showFilters && (
                    <FilterBar
                      results={globalJobs}
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  )}
                  <ResultsView data={filteredResults} onDraftMail={setDraftMailJob} />
                </div>
              )}
            </div>

            {draftMailJob && (
              <DraftMailModal
                job={draftMailJob}
                onClose={() => setDraftMailJob(null)}
              />
            )}
          </div>
        )}
      </main>
      <footer style={{
        marginTop: 'auto',
        padding: '3rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--surface-color)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>God Bless You Mails</h3>
          <p style={{ margin: 0, maxWidth: '500px', lineHeight: '1.5' }}>
            Your central hub for tracking placement opportunities and organizing your job search. Restricted to VIT Bhopal students.
          </p>
          <div style={{ margin: '1rem 0' }}>
            <p style={{ margin: 0 }}>
              Is Your Resume ATS-Ready?{' '}
              <a 
                href="https://reshape-shapeypouresume.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}
              >
                Find Out in Seconds.
              </a>
            </p>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', width: '100%' }}>
            &copy; {new Date().getFullYear()} God Bless You Mails. All rights reserved. Built for VIT Bhopal.
          </div>
        </div>
      </footer>
    </div>
  );
}
