import { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './components/Header';
import EmailInput from './components/EmailInput';
import FilterBar from './components/FilterBar';
import ResultsView from './components/ResultsView';
import Spinner from './components/Spinner';
import ErrorBanner from './components/ErrorBanner';
import DraftMailModal from './components/DraftMailModal';
import { useLocalStorage } from './hooks/useLocalStorage';

const DEFAULT_FILTERS = {
  workModes: [],
  employmentTypes: [],
  batches: [],
  includeUnspecifiedBatch: true,
  searchText: '',
};

// ── Deduplication helper ──────────────────────────────────────────────────
function deduplicateResults(results) {
  const seen = new Set();
  return results.filter((job) => {
    // Create a normalized key from company + role (case-insensitive, trimmed)
    const key = `${(job.company || '').trim().toLowerCase()}::${(job.role || '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function App() {
  const [rawText, setRawText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftMailJob, setDraftMailJob] = useState(null);

  // Theme state persisted in localStorage
  const [theme, setTheme] = useLocalStorage('placement_filter_theme', 'dark');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  // Persist last results in localStorage
  const [savedResults, setSavedResults, removeSavedResults] = useLocalStorage(
    'placement_filter_results',
    null
  );

  // ── Parse email via backend ─────────────────────────────────────────────
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

      // Deduplicate results client-side
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

  // ── Load saved results ──────────────────────────────────────────────────
  const handleLoadSaved = useCallback(() => {
    if (savedResults) {
      setResults(savedResults);
      setFilters(DEFAULT_FILTERS);
      setError(null);
    }
  }, [savedResults]);

  // ── Apply filters ───────────────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    if (!results) return null;

    return results.filter((job) => {
      // Work mode filter
      if (filters.workModes.length > 0 && !filters.workModes.includes(job.work_mode)) {
        return false;
      }

      // Employment type filter
      if (
        filters.employmentTypes.length > 0 &&
        !filters.employmentTypes.includes(job.employment_type)
      ) {
        return false;
      }

      // Batch year filter
      if (filters.batches.length > 0) {
        const jobBatches = job.eligible_batches || [];
        if (jobBatches.length === 0) {
          if (!filters.includeUnspecifiedBatch) return false;
        } else {
          const hasMatchingBatch = jobBatches.some((b) => filters.batches.includes(b));
          if (!hasMatchingBatch) return false;
        }
      } else if (!filters.includeUnspecifiedBatch) {
        const jobBatches = job.eligible_batches || [];
        if (jobBatches.length === 0) return false;
      }

      // Text search
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
      {loading && <Spinner />}

      <Header theme={theme} onToggleTheme={toggleTheme} />

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
