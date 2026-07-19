export default function Spinner() {
  return (
    <div className="spinner-overlay">
      <div className="spinner-ring" />
      <p className="spinner-text">Parsing email with AI…</p>
      <p className="spinner-subtext">This may take a few seconds</p>
    </div>
  );
}
