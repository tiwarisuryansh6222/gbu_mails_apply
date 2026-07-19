import { useState } from 'react';

export default function EmailInput({
  rawText,
  onRawTextChange,
  onParse,
  loading,
  hasSavedResults,
  onLoadSaved,
}) {
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'link'

  return (
    <section className="email-input-section glass-card">
      <div className="section-label">
        <span>📧</span>
        <span>Placement Email Input</span>
      </div>

      <div className="input-mode-tabs">
        <button
          className={`input-mode-tab ${inputMode === 'paste' ? 'active' : ''}`}
          onClick={() => setInputMode('paste')}
          type="button"
        >
          📋 Paste Text
        </button>
        <button
          className={`input-mode-tab ${inputMode === 'link' ? 'active' : ''}`}
          onClick={() => setInputMode('link')}
          type="button"
        >
          🔗 Email / Link
        </button>
      </div>

      {inputMode === 'paste' ? (
        <textarea
          id="email-textarea"
          className="email-textarea"
          placeholder={"Paste the full raw text of a placement cell email here…\n\nExample:\nCompany: TechCorp\nRole: SDE Intern\nBatch: 2026\nStipend: ₹25,000/month\nMode: Remote\nDeadline: 25th July 2025\nApply: https://techcorp.com/apply"}
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          disabled={loading}
        />
      ) : (
        <div>
          <input
            id="email-link-input"
            className="email-link-input"
            type="text"
            placeholder="Paste an email link, Google Groups link, or forwarded email content URL…"
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            disabled={loading}
          />
          <p className="email-link-note">
            💡 Tip: If you have an email link/URL, paste it here. Otherwise, copy-paste the full email text using the "Paste Text" tab.
          </p>
        </div>
      )}

      <div className="input-actions">
        <button
          id="parse-button"
          className="btn btn-primary"
          onClick={onParse}
          disabled={loading || !rawText.trim()}
        >
          {loading ? '⏳ Parsing…' : '🚀 Parse & Filter'}
        </button>
        {hasSavedResults && (
          <span className="saved-indicator" onClick={onLoadSaved}>
            💾 Saved results available — click to load
          </span>
        )}
      </div>
    </section>
  );
}
