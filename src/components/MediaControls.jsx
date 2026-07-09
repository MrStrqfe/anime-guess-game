// Picks the speaker icon that matches the current audio state:
// muted/silent, quiet (below half), or loud.
function volumeIconClass(muted, volume) {
  if (muted || volume === 0) return "fas fa-volume-mute";
  if (volume < 0.5) return "fas fa-volume-down";
  return "fas fa-volume-up";
}

// Shared shell for the round playback buttons.
const controlBtnClasses =
  "bg-[rgba(140,170,255,0.08)] text-light border border-transparent rounded-full " +
  "w-[42px] h-[42px] max-phone:w-11 max-phone:h-11 text-[0.95rem] cursor-pointer " +
  "flex items-center justify-center " +
  "transition-[background-color,border-color,transform] duration-200 " +
  "hover:bg-[rgba(140,170,255,0.16)] hover:border-line hover:scale-[1.08]";

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
    <div
      className="flex justify-center items-center gap-3.5 max-phone:gap-2.5 mt-[clamp(10px,1.6vh,16px)]
        px-4 py-2 max-phone:px-2.5 bg-[rgba(5,8,18,0.6)] border border-line rounded-[10px] flex-wrap"
    >
      <button
        id="play-pause-btn"
        className={`${controlBtnClasses} bg-linear-135/srgb from-primary to-secondary
          shadow-[0_0_18px_rgba(255,46,126,0.35)] hover:shadow-[0_0_26px_rgba(255,46,126,0.55)]`}
        onClick={onPlayPause}
      >
        <i className={`${paused ? "fas fa-play" : "fas fa-pause"} icon`}></i>
      </button>
      <button id="reset-video-btn" className={controlBtnClasses} onClick={onRestart}>
        <i className="fas fa-redo"></i>
      </button>
      <div className="flex items-center gap-2.5">
        <button id="mute-btn" className={controlBtnClasses} onClick={onToggleMute}>
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
      {/* Desktop-only cheat sheet for the global shortcuts wired up in App.
          Stays styled in styles.css (max-width/max-height hide rules). */}
      <div className="kbd-hints" aria-hidden="true">
        <span><kbd>Space</kbd> play</span>
        <span><kbd>R</kbd> restart</span>
        <span><kbd>M</kbd> mute</span>
        <span><kbd>←</kbd><kbd>→</kbd> volume</span>
      </div>
    </div>
  );
}
