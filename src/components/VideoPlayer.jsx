import { forwardRef } from "react";

// The clip being guessed. Stays blurred until the round is over (correct
// guess or out of guesses), then `revealed` removes the blur. The ref is
// forwarded so App can control playback (play/pause/volume) directly.
const VideoPlayer = forwardRef(function VideoPlayer({ src, revealed }, ref) {
  return (
    <div className="video-wrapper">
      <video
        id="anime-video"
        ref={ref}
        src={src}
        style={{ filter: revealed ? "none" : "blur(5px)" }}
      ></video>
      <div className="video-overlay"></div>
    </div>
  );
});

export default VideoPlayer;
