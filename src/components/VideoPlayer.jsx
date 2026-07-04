import { forwardRef } from "react";

const VideoPlayer = forwardRef(function VideoPlayer({ src, revealed }, ref) {
  return (
    <div className="video-wrapper">
      <video
        id="anime-video"
        ref={ref}
        src={src}
        controls
        style={{ filter: revealed ? "none" : "blur(5px)" }}
      ></video>
      <div className="video-overlay"></div>
    </div>
  );
});

export default VideoPlayer;
