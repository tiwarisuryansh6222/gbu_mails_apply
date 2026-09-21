import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, loginWithGoogle, loginWithEmail, signUpWithEmail, logoutUser } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', opacity: 0.6 }}>
            <div className="loading-spinner" style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
