import { useState, useMemo } from 'react';
import JobCard from './JobCard';
import JobTable from './JobTable';
import { exportToCSV } from '../utils/csv';

export default function ResultsView({ data, onDraftMail }) {
  // Default to table view (sheet format)
  const [viewMode, setViewMode] = useState('table');
  const [sortConfig, setSortConfig] = useState(null);

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
        <JobTable data={sortedData} sortConfig={sortConfig} onSort={handleSort} onDraftMail={onDraftMail} />
      ) : (
        <div className="cards-grid">
          {sortedData.map((job, i) => (
            <JobCard
              key={`${job.company}-${job.role}-${i}`}
              job={job}
              style={{ animationDelay: `${i * 50}ms` }}
              onDraftMail={onDraftMail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
