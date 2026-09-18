import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, Clock, Plus, X } from 'lucide-react';

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

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [adding, setAdding] = useState(false);

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

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;
    
    setAdding(true);
    try {
      const newApp = {
        userId: currentUser.uid,
        company: newCompany.trim(),
        role: newRole.trim(),
        appliedAt: new Date().toISOString(),
        statuses: {
          applied: true,
          test_given: false,
          interview_round: false,
          hr_round: false,
          placed: false
        }
      };

      const docRef = await addDoc(collection(db, 'applications'), newApp);
      
      // Update local state immediately
      setApplications(prev => [{ id: docRef.id, ...newApp }, ...prev]);
      
      // Reset and close modal
      setNewCompany('');
      setNewRole('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding application: ", error);
      alert("Failed to add application");
    } finally {
      setAdding(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <div style={{ padding: '2rem', flex: 1, position: 'relative' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>My Applications</h1>
          <button className="primary-btn" onClick={() => setIsAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Application
          </button>
        </div>

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
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-medium)' }} />
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

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setIsAddModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Manual Add</h2>
            
            <form onSubmit={handleAddApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Company Name</label>
                <input 
                  type="text" 
                  value={newCompany} 
                  onChange={(e) => setNewCompany(e.target.value)} 
                  placeholder="e.g., Google" 
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role / Position</label>
                <input 
                  type="text" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)} 
                  placeholder="e.g., Software Engineer" 
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              
              <button type="submit" className="primary-btn" disabled={adding} style={{ marginTop: '1rem' }}>
                {adding ? 'Saving...' : 'Save Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
