import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

const STATUS_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'test_given', label: 'Test Given' },
  { id: 'interview_round', label: 'Interview Round' },
  { id: 'hr_round', label: 'HR Round' },
  { id: 'placed', label: 'Placed' }
];

export default function Dashboard({ theme, onToggleTheme }) {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchApplications = async () => {
      try {
        const q = query(
          collection(db, 'applications'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const apps = [];
        querySnapshot.forEach((doc) => {
          apps.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date descending
        apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        setApplications(apps);
      } catch (error) {
        console.error("Error fetching applications: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser]);

  const toggleStatus = async (appId, currentStatuses, statusId) => {
    try {
      const appRef = doc(db, 'applications', appId);
      const newStatuses = { ...currentStatuses, [statusId]: !currentStatuses[statusId] };
      
      // Optimistic UI update
      setApplications(apps => apps.map(app => 
        app.id === appId ? { ...app, statuses: newStatuses } : app
      ));

      await updateDoc(appRef, { statuses: newStatuses });
    } catch (error) {
      console.error("Error updating status: ", error);
      // Revert on error could be implemented here
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <div style={{ padding: '2rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="secondary-btn" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Home
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <img src={currentUser?.photoURL} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{currentUser?.displayName}</span>
            </div>
            <button className="secondary-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>My Applications</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading your dashboard...</div>
        ) : applications.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>No applications yet!</h2>
            <p style={{ marginBottom: '1.5rem' }}>Go parse some emails and start tracking your placement journey.</p>
            <button className="primary-btn" onClick={() => navigate('/parse')}>Parse Placement Mails</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {applications.map((app) => (
              <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-color)' }}>{app.company}</h2>
                    <h3 style={{ margin: '0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{app.role}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Clock size={14} />
                    Applied on: {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  {STATUS_STAGES.map((stage) => {
                    const isChecked = app.statuses?.[stage.id] || false;
                    return (
                      <label 
                        key={stage.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          cursor: 'pointer',
                          color: isChecked ? 'var(--primary-color)' : 'var(--text-secondary)',
                          transition: 'color 0.2s'
                        }}
                      >
                        <div onClick={() => toggleStatus(app.id, app.statuses || {}, stage.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          {isChecked ? (
                            <CheckCircle2 size={20} color="var(--primary-color)" />
                          ) : (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                          )}
                        </div>
                        <span style={{ fontSize: '0.9rem', userSelect: 'none' }}>{stage.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
