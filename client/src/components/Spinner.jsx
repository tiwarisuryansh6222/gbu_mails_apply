export default function Spinner() {
  return (
    <div className="spinner-overlay">
      <div className="spinner-dots">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <p className="spinner-text">Parsing email with AI…</p>
      <p className="spinner-subtext">Extracting job postings — this may take a few seconds</p>
    </div>
  );
}
