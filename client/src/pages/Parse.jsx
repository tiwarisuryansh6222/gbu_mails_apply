import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EmailInput from '../components/EmailInput';
import FilterBar from '../components/FilterBar';
import ResultsView from '../components/ResultsView';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import DraftMailModal from '../components/DraftMailModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeft } from 'lucide-react';

const DEFAULT_FILTERS = {
  workModes: [],
  employmentTypes: [],
  batches: [],
  includeUnspecifiedBatch: true,
  searchText: '',
};

function deduplicateResults(results) {
  const seen = new Set();
  return results.filter((job) => {
    const key = `${(job.company || '').trim().toLowerCase()}::${(job.role || '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Parse({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftMailJob, setDraftMailJob] = useState(null);

  const [savedResults, setSavedResults] = useLocalStorage(
    'placement_filter_results',
    null
  );

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const deduped = deduplicateResults(data.results || []);
      setResults(deduped);
      setSavedResults(deduped);
      setFilters(DEFAULT_FILTERS);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [rawText, setSavedResults]);

  const handleLoadSaved = useCallback(() => {
    if (savedResults) {
      setResults(savedResults);
      setFilters(DEFAULT_FILTERS);
      setError(null);
    }
  }, [savedResults]);

  const filteredResults = useMemo(() => {
    if (!results) return null;

    return results.filter((job) => {
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
        const query = filters.searchText.toLowerCase();
        const companyMatch = (job.company || '').toLowerCase().includes(query);
        const roleMatch = (job.role || '').toLowerCase().includes(query);
        if (!companyMatch && !roleMatch) return false;
      }

      return true;
    });
  }, [results, filters]);

  return (
    <div className="app-container">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {loading && <Spinner />}
      <Header theme={theme} onToggleTheme={onToggleTheme} />

      <button className="secondary-btn page-back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back to Home
      </button>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={handleParse}
          onDismiss={() => setError(null)}
        />
      )}

      <EmailInput
        rawText={rawText}
        onRawTextChange={setRawText}
        onParse={handleParse}
        loading={loading}
        hasSavedResults={!!savedResults && !results}
        onLoadSaved={handleLoadSaved}
      />

      {filteredResults && (
        <div className="results-layout">
          <FilterBar
            results={results}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <ResultsView data={filteredResults} onDraftMail={setDraftMailJob} />
        </div>
      )}

      {draftMailJob && (
        <DraftMailModal
          job={draftMailJob}
          onClose={() => setDraftMailJob(null)}
        />
      )}
    </div>
  );
}
