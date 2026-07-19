export default function ErrorBanner({ message, onRetry, onDismiss }) {
  return (
    <div className="error-banner">
      <span className="error-icon">⚠️</span>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-small" onClick={onRetry}>
          ↻ Retry
        </button>
      )}
      {onDismiss && (
        <button className="btn btn-secondary btn-small" onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  );
}
