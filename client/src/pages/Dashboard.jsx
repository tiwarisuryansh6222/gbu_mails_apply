import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, Clock, Plus, X, LogOut } from 'lucide-react';

const STATUS_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'test_given', label: 'Test Given' },
  { id: 'interview_round', label: 'Interview' },
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

  // Stats
  const stats = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter(app => {
      const s = app.statuses || {};
      return s.applied && !s.placed;
    }).length;
    const placed = applications.filter(app => app.statuses?.placed).length;
    return { total, inProgress, placed };
  }, [applications]);

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
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <div className="dashboard-content">
        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <button className="secondary-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Home
          </button>
          
          <div className="dashboard-user-section">
            <button className="secondary-btn" onClick={handleLogout}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* Title + Add button */}
        <div className="dashboard-title-row">
          <h1 className="dashboard-title">My Applications</h1>
          <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Add Application
          </button>
        </div>

        {/* Stats Bar */}
        {!loading && applications.length > 0 && (
          <div className="dashboard-stats">
            <div className="glass-panel stat-card highlight">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Applied</div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-value">{stats.placed}</div>
              <div className="stat-label">Placed 🎉</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">Loading your dashboard…</div>
        ) : applications.length === 0 ? (
          <div className="glass-panel dashboard-empty">
            <span className="empty-icon">📋</span>
            <h2>No applications yet!</h2>
            <p>Go parse some emails and start tracking your placement journey.</p>
            <button className="primary-btn" onClick={() => navigate('/parse')}>
              Parse Placement Mails
            </button>
          </div>
        ) : (
          <div className="app-cards-list">
            {applications.map((app) => (
              <div key={app.id} className="glass-panel app-card">
                <div className="app-card-header">
                  <div className="app-card-info">
                    <h2>{app.company}</h2>
                    <h3>{app.role}</h3>
                  </div>
                  <div className="app-card-date">
                    <Clock size={14} />
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Status Pipeline */}
                <div className="status-pipeline">
                  {STATUS_STAGES.map((stage, idx) => {
                    const isChecked = app.statuses?.[stage.id] || false;
                    // Connector is active if this stage is checked
                    const showConnector = idx < STATUS_STAGES.length - 1;
                    return (
                      <React.Fragment key={stage.id}>
                        <div
                          className={`status-step ${isChecked ? 'checked' : ''}`}
                          onClick={() => toggleStatus(app.id, app.statuses || {}, stage.id)}
                        >
                          <div className="status-step-circle">
                            {isChecked && <CheckCircle2 size={14} />}
                          </div>
                          <span className="status-step-label">{stage.label}</span>
                        </div>
                        {showConnector && (
                          <div className={`status-step-connector ${isChecked ? 'active' : ''}`} />
                        )}
                      </React.Fragment>
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
        <div className="dashboard-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsAddModalOpen(false)}>
          <div className="glass-panel dashboard-modal">
            <button 
              className="dashboard-modal-close"
              onClick={() => setIsAddModalOpen(false)}
            >
              <X size={16} />
            </button>
            <h2>Add Application</h2>
            
            <form onSubmit={handleAddApplication}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newCompany} 
                  onChange={(e) => setNewCompany(e.target.value)} 
                  placeholder="e.g., Google" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Position</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)} 
                  placeholder="e.g., Software Engineer" 
                  required
                />
              </div>
              
              <button type="submit" className="primary-btn" disabled={adding} style={{ width: '100%', marginTop: '0.5rem' }}>
                {adding ? 'Saving…' : 'Save Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
