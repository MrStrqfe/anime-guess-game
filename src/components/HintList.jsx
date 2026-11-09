// Daily mode hints. One row per hint: unlocked ones show their text, locked
// ones say when they unlock. Both rows are always shown so the card doesn't
// jump in height when a hint appears.
export default function HintList({ hints, unlocked, unlockAt }) {
  return (
    <ul className="mt-3 mb-0 p-0 list-none flex flex-col gap-1.5" aria-label="Hints">
      {hints.map((hint, i) => {
        const open = i < unlocked;
        return (
          <li
            key={i}
            className={`flex items-baseline gap-2.5 px-3 py-2 rounded-[10px] text-[13px] tracking-[-0.01em] leading-snug ${
              open ? "bg-fill text-body-soft" : "bg-tile text-tert"
            }`}
          >
            <span className={`shrink-0 font-medium ${open ? "text-light" : ""}`}>Hint {i + 1}</span>
            <span className="min-w-0 break-words">
              {open ? hint : `Unlocks at ${unlockAt[i]}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
