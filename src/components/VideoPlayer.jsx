import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// The clip being guessed. Stays blurred and zoomed until the round is over
// (correct guess or out of guesses); `revealed` transitions both off over
// 0.9s. `blur` sets how strong the effect is (daily mode eases it after each
// miss), defaulting to the full-strength practice look. A drifting shimmer overlay marks the "mystery" state, and a
// spinner covers the frame while a new clip is buffering.
//
// The ref exposes the raw <video> element so App can control playback
// (play/pause/volume) directly. `children` renders inside the wrapper —
// App uses it to overlay the media-controls pill; `onHoverChange` reports
// pointer hover so App can decide when that pill is visible.
//
// `maxTime` (daily mode) caps playback: at that many seconds the clip pauses
// and rewinds to the start, so Play replays only the unlocked part.
const FULL_BLUR = { px: 10, scale: 1.12 };

const VideoPlayer = forwardRef(function VideoPlayer(
  { src, revealed, blur = FULL_BLUR, maxTime, onHoverChange, children },
  ref
) {
  const innerRef = useRef(null);
  useImperativeHandle(ref, () => innerRef.current);
  const [loading, setLoading] = useState(false);

  // Read through a ref so the playback loop below always sees the latest
  // limit without restarting.
  const maxTimeRef = useRef(maxTime);
  maxTimeRef.current = maxTime;

  // While playing, check the position every animation frame (timeupdate only
  // fires about every 250ms, which would overshoot the limit audibly).
  useEffect(() => {
    const video = innerRef.current;
    if (!video) return;
    let frame = 0;

    const tick = () => {
      const limit = maxTimeRef.current;
      if (limit != null && video.currentTime >= limit) {
        video.pause();
        video.currentTime = 0;
        return;
      }
      if (!video.paused) frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(frame);

    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    return () => {
      stop();
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
    };
  }, []);

  return (
    <div
      className="video-wrapper"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <video
        id="anime-video"
        ref={innerRef}
        src={src}
        preload="auto"
        onLoadStart={() => setLoading(Boolean(src))}
        onCanPlay={() => setLoading(false)}
        onError={() => setLoading(false)}
        style={{
          filter: revealed ? "none" : `blur(${blur.px}px) saturate(1.25)`,
          transform: revealed ? "scale(1)" : `scale(${blur.scale})`,
        }}
      ></video>
      {!revealed && !loading && <div className="video-shimmer"></div>}
      {loading && (
        <div className="video-loading">
          <div className="spinner"></div>
          <div className="text-[13px] text-dim tracking-[-0.01em]">Loading opening…</div>
        </div>
      )}
      {children}
    </div>
  );
});

export default VideoPlayer;
