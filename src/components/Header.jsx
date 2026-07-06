// Static page header: title, tagline, and decorative dots. No props or state.
export default function Header() {
  return (
    <header className="anime-header">
      <h1>
        <span className="gradient-text">AniBlur</span>
      </h1>
      <h3>Can you recognize the anime from its opening?</h3>
      <div className="header-decoration">
        <div className="decoration-item"></div>
        <div className="decoration-item"></div>
        <div className="decoration-item"></div>
      </div>
    </header>
  );
}
