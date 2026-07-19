import { useState, useMemo } from 'react';

const WORK_MODES = ['remote', 'hybrid', 'onsite', 'unspecified'];
const EMPLOYMENT_TYPES = ['fresher', 'internship', 'experienced', 'unspecified'];

export default function FilterBar({ results, filters, onFiltersChange }) {
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [mobileCollapsed, setMobileCollapsed] = useState(true);

  // Dynamically extract all batch years from results
  const allBatches = useMemo(() => {
    const batchSet = new Set();
    (results || []).forEach((job) => {
      (job.eligible_batches || []).forEach((b) => batchSet.add(b));
    });
    return [...batchSet].sort();
  }, [results]);

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const resetFilters = () => {
    onFiltersChange({
      workModes: [],
      employmentTypes: [],
      batches: [],
      includeUnspecifiedBatch: true,
      searchText: '',
    });
  };

  return (
    <>
      <button
        className="btn btn-secondary filter-toggle-mobile"
        onClick={() => setMobileCollapsed(!mobileCollapsed)}
      >
        {mobileCollapsed ? '☰ Show Filters' : '✕ Hide Filters'}
      </button>

      <aside className={`filter-sidebar glass-card ${mobileCollapsed ? 'collapsed' : ''}`}>
        <div className="filter-header">
          <h2>🔍 Filters</h2>
          <button className="btn btn-secondary btn-small" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <div className="filter-content">
          {/* Search */}
          <div className="filter-group">
            <div className="filter-group-title">Search</div>
            <input
              id="filter-search"
              className="filter-search"
              type="text"
              placeholder="Company or role name…"
              value={filters.searchText || ''}
              onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
            />
          </div>

          {/* Work Mode */}
          <div className="filter-group">
            <div className="filter-group-title">Work Mode</div>
            <div className="checkbox-group">
              {WORK_MODES.map((mode) => (
                <label key={mode} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(filters.workModes || []).includes(mode)}
                    onChange={() => toggleArrayFilter('workModes', mode)}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Employment Type */}
          <div className="filter-group">
            <div className="filter-group-title">Employment Type</div>
            <div className="checkbox-group">
              {EMPLOYMENT_TYPES.map((type) => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(filters.employmentTypes || []).includes(type)}
                    onChange={() => toggleArrayFilter('employmentTypes', type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Batch Year */}
          <div className="filter-group">
            <div className="filter-group-title">Batch Year</div>
            {allBatches.length > 0 ? (
              <div className="multi-select">
                <button
                  className="multi-select-trigger"
                  onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
                  type="button"
                >
                  <span>
                    {(filters.batches || []).length === 0
                      ? 'All batches'
                      : `${(filters.batches || []).length} selected`}
                  </span>
                  <span className={`arrow ${batchDropdownOpen ? 'open' : ''}`}>▼</span>
                </button>
                {batchDropdownOpen && (
                  <div className="multi-select-dropdown">
                    {allBatches.map((year) => (
                      <label key={year} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={(filters.batches || []).includes(year)}
                          onChange={() => toggleArrayFilter('batches', year)}
                        />
                        <span>{year}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No batch data found
              </p>
            )}
            <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={filters.includeUnspecifiedBatch !== false}
                onChange={() =>
                  onFiltersChange({
                    ...filters,
                    includeUnspecifiedBatch: !filters.includeUnspecifiedBatch,
                  })
                }
              />
              <span>Include unspecified batch</span>
            </label>
          </div>
        </div>
      </aside>
    </>
  );
}
