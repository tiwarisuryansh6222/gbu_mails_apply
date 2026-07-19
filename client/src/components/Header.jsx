export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header-center">
        <h1>⚡ Placement Filter</h1>
        <p>Paste your placement email → AI extracts → You filter &amp; export</p>
      </div>
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
