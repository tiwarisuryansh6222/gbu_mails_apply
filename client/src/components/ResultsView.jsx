import { useState, useMemo, useEffect } from 'react';
import JobCard from './JobCard';
import JobTable from './JobTable';
import { exportToCSV } from '../utils/csv';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function ResultsView({ data, onDraftMail }) {
  // Default to table view (sheet format)
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState(null);
  const { currentUser } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState({});
  const [togglingJob, setTogglingJob] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'applications'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.forEach((docItem) => {
        const d = docItem.data();
        const key = `${(d.company || '').trim().toLowerCase()}::${(d.role || '').trim().toLowerCase()}`;
        map[key] = docItem.id;
      });
      setAppliedJobs(map);
    }, (err) => {
      console.error("Error listening to applications:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleToggleApply = async (job) => {
    if (!currentUser) {
      alert("Please login to track applications.");
      return;
    }
    const key = `${(job.company || '').trim().toLowerCase()}::${(job.role || '').trim().toLowerCase()}`;
    const existingDocId = appliedJobs[key];
    setTogglingJob(prev => ({ ...prev, [key]: true }));

    try {
      if (existingDocId) {
        await deleteDoc(doc(db, 'applications', existingDocId));
      } else {
        await addDoc(collection(db, 'applications'), {
          userId: currentUser.uid,
          company: job.company || 'Unknown',
          role: job.role || 'Unknown',
          appliedAt: new Date().toISOString(),
          statuses: {
            applied: true,
            test_given: false,
            interview_round: false,
            hr_round: false,
            placed: false
          },
          jobDetails: job
        });
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      alert("Failed to update status.");
    } finally {
      setTogglingJob(prev => ({ ...prev, [key]: false }));
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const sorted = [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle array fields
      if (Array.isArray(aVal)) aVal = aVal.join(', ');
      if (Array.isArray(bVal)) bVal = bVal.join(', ');

      aVal = String(aVal ?? '').toLowerCase();
      bVal = String(bVal ?? '').toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null; // third click removes sort
      }
      return { key, direction: 'asc' };
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No results to show</h3>
        <p>
          Paste a placement email above and click "Parse & Filter" to get started, or
          adjust your filters if results were already parsed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="results-header">
        <div className="results-count">
          Showing <strong>{sortedData.length}</strong> posting{sortedData.length !== 1 ? 's' : ''}
        </div>
        <div className="results-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              ☰ Table
            </button>
            <button
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
            >
              ▦ Cards
            </button>
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => exportToCSV(sortedData)}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <JobTable 
          data={sortedData} 
          sortConfig={sortConfig} 
          onSort={handleSort} 
          onDraftMail={onDraftMail}
          appliedJobs={appliedJobs}
          togglingJob={togglingJob}
          onToggleApply={handleToggleApply}
        />
      ) : (
        <div className="cards-grid">
          {sortedData.map((job, i) => {
            const key = `${(job.company || '').trim().toLowerCase()}::${(job.role || '').trim().toLowerCase()}`;
            return (
              <JobCard
                key={`${job.company}-${job.role}-${i}`}
                job={job}
                style={{ animationDelay: `${i * 50}ms` }}
                onDraftMail={onDraftMail}
                isApplied={!!appliedJobs[key]}
                isToggling={!!togglingJob[key]}
                onToggleApply={() => handleToggleApply(job)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
