export default function ActionButtons({
  submitVisible,
  onSubmit,
  usingOnlineClips,
  sourceLoading,
  onToggleSource,
}) {
  return (
    <>
      <div className="button-stack">
        <button
          id="submit-btn"
          className={`action-btn submit-btn ${submitVisible ? "" : "hidden"}`}
          onClick={onSubmit}
        >
          <i className="fas fa-check"></i> Submit
        </button>
        <button id="next-btn" className="action-btn next-btn hidden">
          <i className="fas fa-forward"></i> Next
        </button>
      </div>

      <button id="clip-source-btn" className="text-icon-btn" disabled={sourceLoading} onClick={onToggleSource}>
        {sourceLoading ? (
          <>
            <span className="icon">⏳</span> Loading...
          </>
        ) : usingOnlineClips ? (
          <>
            <span className="icon">💾</span> Use Local Clips
          </>
        ) : (
          <>
            <i className="fas fa-globe"></i> Use Online Database
          </>
        )}
      </button>
    </>
  );
}
