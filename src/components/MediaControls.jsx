import Icon, { PATHS } from "./icons";

// Picks the speaker icon that matches the current audio state:
// muted/silent, quiet (below half), or loud.
function volumeIconPath(muted, volume) {
  if (muted || volume === 0) return PATHS.volumeMute;
  if (volume < 0.5) return PATHS.volumeLow;
  return PATHS.volumeHigh;
}

// Frosted playback pill overlaid at the bottom of the video: play/pause,
// restart, mute, and a volume slider. Stateless — it renders the props and
// reports clicks back to App, which owns the actual <video> element.
// `visible` fades the pill in when the video is hovered or paused.
export default function MediaControls({
  visible,
  paused,
  muted,
  volume,
  onPlayPause,
  onRestart,
  onToggleMute,
  onVolumeChange,
}) {
  return (
    <div
      className="media-pill"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <button id="play-pause-btn" aria-label="Play or pause" onClick={onPlayPause}>
        <Icon path={paused ? PATHS.play : PATHS.pause} size={16} fill="#f5f5f7" />
      </button>
      <button id="reset-video-btn" aria-label="Restart clip" onClick={onRestart}>
        <Icon path={PATHS.restart} size={15} fill="#f5f5f7" />
      </button>
      <button id="mute-btn" aria-label="Mute or unmute" onClick={onToggleMute}>
        <Icon path={volumeIconPath(muted, volume)} size={16} fill="#f5f5f7" />
      </button>
      <input
        type="range"
        id="volume-slider"
        min="0"
        max="1"
        step="0.01"
        aria-label="Volume"
        value={muted ? 0 : volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
