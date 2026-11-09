import { useEffect, useRef } from "react";
import { STAGE_SECONDS } from "../lib/daily";

const TOTAL = STAGE_SECONDS[STAGE_SECONDS.length - 1];

function formatStage(seconds) {
  return seconds >= 60 ? `${seconds / 60}:00` : `${seconds}s`;
}

// Daily mode: how much of the opening is unlocked. A thin bar spans the full
// minute with markers at each stage (8s / 30s / 1:00); the unlocked part is
// lighter, the playback position fills in blue, and the Skip button beside
// it unlocks the next stage (or gives up on the last one).
//
// The blue fill follows `videoRef` directly (set on the DOM node every frame
// while playing), so playback doesn't re-render the app.
export default function ClipTimeline({ videoRef, limit, skipLabel, onSkip, disabled }) {
  const fillRef = useRef(null);
  const limitRef = useRef(limit);
  limitRef.current = limit;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let frame = 0;

    const draw = () => {
      if (!fillRef.current) return;
      const t = Math.min(video.currentTime, limitRef.current);
      fillRef.current.style.width = `${(t / TOTAL) * 100}%`;
    };
    const tick = () => {
      draw();
      if (!video.paused) frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      draw();
    };

    draw();
    if (!video.paused) start();
    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    video.addEventListener("seeked", draw);
    video.addEventListener("loadstart", draw);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
      video.removeEventListener("seeked", draw);
      video.removeEventListener("loadstart", draw);
    };
  }, [videoRef]);

  return (
    <div className="flex items-center gap-3 mt-3.5">
      <div className="flex-1 min-w-0">
        <div
          className="relative h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-y-0 left-0 bg-[rgba(255,255,255,0.22)] transition-[width] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ width: `${(limit / TOTAL) * 100}%` }}
          />
          <div ref={fillRef} className="absolute inset-y-0 left-0 w-0 bg-accent" />
          {STAGE_SECONDS.slice(0, -1).map((s) => (
            <div
              key={s}
              className="absolute inset-y-0 w-0.5 bg-[rgba(0,0,0,0.55)]"
              style={{ left: `${(s / TOTAL) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative h-4 mt-1.5 text-[11px] text-tert [font-variant-numeric:tabular-nums]">
          {STAGE_SECONDS.map((s) => (
            <span
              key={s}
              className={`absolute top-0 ${s === TOTAL ? "right-0" : "-translate-x-1/2"} ${
                s <= limit ? "text-dim" : ""
              }`}
              style={s === TOTAL ? undefined : { left: `${(s / TOTAL) * 100}%` }}
            >
              {formatStage(s)}
            </span>
          ))}
        </div>
        <span className="sr-only">{`${formatStage(limit)} of the opening unlocked`}</span>
      </div>
      <button
        id="skip-btn"
        type="button"
        disabled={disabled}
        onClick={onSkip}
        className="h-8 px-3.5 rounded-[980px] border border-line bg-transparent text-body-soft
          font-body text-[13px] tracking-[-0.01em] cursor-pointer shrink-0 whitespace-nowrap
          transition-colors duration-200 hover:bg-fill disabled:opacity-40 disabled:cursor-default"
      >
        {skipLabel}
      </button>
    </div>
  );
}
