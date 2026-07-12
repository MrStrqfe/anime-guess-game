// Inline SVG icons (24×24 viewBox paths from the AniBlur design handoff).
// Replaces Font Awesome so the app ships no icon font.

function Icon({ path, size = 16, fill = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export const PATHS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  restart:
    "M12 5V1L7 6l5 5V7c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H4c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z",
  volumeMute:
    "M16.5 12c0-1.8-1-3.3-2.5-4v2.2l2.5 2.5V12zM19 12c0 .9-.2 1.8-.5 2.6l1.5 1.5c.7-1.2 1-2.6 1-4.1 0-4.3-3-7.9-7-8.8v2.1c2.9.9 5 3.5 5 6.7zM4.3 3L3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3c-.7.5-1.4.9-2.3 1.2v2.1c1.4-.3 2.6-.9 3.7-1.8l2 2L21 19.7 4.3 3zM12 4L9.9 6.1 12 8.2V4z",
  volumeLow: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4z",
  volumeHigh:
    "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4zM14 3.2v2.1c2.9.9 5 3.5 5 6.7s-2.1 5.8-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z",
  person:
    "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",
  check: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
  cross:
    "M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z",
  chevronDown: "M7.4 8.6L12 13.2l4.6-4.6L18 10l-6 6-6-6z",
};

export default Icon;
