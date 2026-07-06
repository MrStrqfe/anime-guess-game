// Picks the speaker icon that matches the current audio state:
// muted/silent, quiet (below half), or loud.
function volumeIconClass(muted, volume) {
  if (muted || volume === 0) return "fas fa-volume-mute";
  if (volume < 0.5) return "fas fa-volume-down";
  return "fas fa-volume-up";
}

// Playback bar under the video: play/pause, restart, mute, and a volume
// slider. Stateless — it renders the props and reports clicks back to App,
// which owns the actual <video> element.
export default function MediaControls({
  paused,
  muted,
  volume,
  onPlayPause,
  onRestart,
  onToggleMute,
  onVolumeChange,
}) {
  return (
    <div className="media-controls">
      <button id="play-pause-btn" className="control-btn play-btn" onClick={onPlayPause}>
        <i className={`${paused ? "fas fa-play" : "fas fa-pause"} icon`}></i>
      </button>
      <button id="reset-video-btn" className="control-btn" onClick={onRestart}>
        <i className="fas fa-redo"></i>
      </button>
      <div className="volume-control">
        <button id="mute-btn" className="control-btn" onClick={onToggleMute}>
          <i className={volumeIconClass(muted, volume)}></i>
        </button>
        <input
          type="range"
          id="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        />
      </div>
      {/* Desktop-only cheat sheet for the global shortcuts wired up in App */}
      <div className="kbd-hints" aria-hidden="true">
        <span><kbd>Space</kbd> play</span>
        <span><kbd>R</kbd> restart</span>
        <span><kbd>M</kbd> mute</span>
        <span><kbd>←</kbd><kbd>→</kbd> volume</span>
      </div>
    </div>
  );
}
