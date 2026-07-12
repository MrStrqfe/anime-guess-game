import { forwardRef, useImperativeHandle, useRef, useState } from "react";

// The clip being guessed. Stays heavily blurred and zoomed until the round
// is over (correct guess or out of guesses); `revealed` transitions both off
// over 0.9s. A drifting shimmer overlay marks the "mystery" state, and a
// spinner covers the frame while a new clip is buffering.
//
// The ref exposes the raw <video> element so App can control playback
// (play/pause/volume) directly. `children` renders inside the wrapper —
// App uses it to overlay the media-controls pill; `onHoverChange` reports
// pointer hover so App can decide when that pill is visible.
const VideoPlayer = forwardRef(function VideoPlayer(
  { src, revealed, onHoverChange, children },
  ref
) {
  const innerRef = useRef(null);
  useImperativeHandle(ref, () => innerRef.current);
  const [loading, setLoading] = useState(false);

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
          filter: revealed ? "none" : "blur(10px) saturate(1.25)",
          transform: revealed ? "scale(1)" : "scale(1.12)",
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
