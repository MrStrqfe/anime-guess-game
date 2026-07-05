import { useMemo } from "react";

const COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "var(--accent)",
  "gold",
  "var(--success)",
];

// Celebration effect shown on a correct guess: 50 falling pieces with
// randomized size, color, position, and timing (the animation itself lives
// in CSS).
export default function Confetti({ active }) {
  // useMemo keeps the random values stable across re-renders, so the pieces
  // are only re-rolled when `active` flips — not on every render.
  const pieces = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 10 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      left: Math.random() * 100,
      animationDuration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      round: Math.random() > 0.5,
    }));
  }, [active]);

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.delay}s`,
            borderRadius: piece.round ? "50%" : undefined,
          }}
        ></div>
      ))}
    </div>
  );
}
