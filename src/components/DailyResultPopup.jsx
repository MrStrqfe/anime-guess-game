import { useEffect, useState } from "react";
import { msUntilNextPuzzle, pointsFor, MAX_DAILY_POINTS, STAGE_SECONDS, STAGE_POINTS } from "../lib/daily";

// Per-anime result squares: solved at stage 1 / 2 / 3, or missed.
const SQUARES = { 1: "🟩", 2: "🟨", 3: "🟧", 0: "🟥" };

// "8s · +100", "1:00 · +30", "Missed"
function attemptLabel(attempt) {
  if (!attempt) return "Missed";
  const seconds = STAGE_SECONDS[attempt - 1];
  const time = seconds >= 60 ? `${seconds / 60}:00` : `${seconds}s`;
  return `${time} · +${STAGE_POINTS[attempt]}`;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function buildShareText(puzzleNumber, attempts) {
  const points = pointsFor(attempts);
  const url = window.location.origin + window.location.pathname;
  return `AniBlur Daily #${puzzleNumber} · ${points}/${MAX_DAILY_POINTS}\n${attempts
    .map((a) => SQUARES[a])
    .join("")}\n${url}`;
}

// End-of-day sheet for daily mode: points, each anime's title with the stage
// it was solved at, streak, share button, and a countdown to tomorrow's puzzle. Shown
// again on revisits until midnight. When the countdown hits zero the page
// reloads so the new puzzle starts.
export default function DailyResultPopup({
  visible,
  puzzleNumber,
  titles,
  attempts,
  streak,
  onPractice,
}) {
  const [countdown, setCountdown] = useState(() => msUntilNextPuzzle());
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    if (!visible) return;
    const tick = () => {
      const remaining = msUntilNextPuzzle();
      setCountdown(remaining);
      if (remaining < 1000) setTimeout(() => window.location.reload(), 1500);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const points = pointsFor(attempts);

  async function handleShare() {
    const text = buildShareText(puzzleNumber, attempts);
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote("Copied to clipboard");
    } catch (error) {
      if (error?.name === "AbortError") return; // user closed the share sheet
      setShareNote("Couldn't copy — try again");
    }
    setTimeout(() => setShareNote(""), 2200);
  }

  return (
    <div id="daily-result-popup" className={`popup ${visible ? "" : "hidden"}`}>
      <div className="sheet w-[min(420px,100%)] pt-9 pb-8">
        <p className="m-0 text-[13px] font-medium tracking-[0.06em] uppercase text-dim">
          Daily #{puzzleNumber}
        </p>
        <div className="mt-3 text-[64px] font-semibold tracking-[-0.04em] leading-none text-light [font-variant-numeric:tabular-nums]">
          {points}
          <span className="text-dim text-[32px] font-medium">/{MAX_DAILY_POINTS}</span>
        </div>
        <p className="mt-1.5 mb-0 text-[13px] text-dim tracking-[-0.01em]">points</p>

        <ul className="mt-5 mb-0 p-0 list-none text-left flex flex-col gap-1">
          {titles.map((title, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-1.5 py-[9px] border-b border-[rgba(255,255,255,0.06)]"
            >
              <span className="text-[18px] leading-none" aria-hidden="true">
                {SQUARES[attempts[i]]}
              </span>
              <span className="flex-1 min-w-0 text-[15px] leading-snug text-body-soft tracking-[-0.01em] break-words">
                {title}
              </span>
              <span className="text-[12px] text-tert shrink-0 [font-variant-numeric:tabular-nums]">
                {attemptLabel(attempts[i])}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-center gap-8 [font-variant-numeric:tabular-nums]">
          <div>
            <div className="text-[22px] font-semibold text-light">{streak.current}</div>
            <div className="text-[12px] text-dim">Day streak</div>
          </div>
          <div>
            <div className="text-[22px] font-semibold text-light">{streak.longest}</div>
            <div className="text-[12px] text-dim">Best streak</div>
          </div>
          <div>
            <div className="text-[22px] font-semibold text-light">{formatCountdown(countdown)}</div>
            <div className="text-[12px] text-dim">Next daily</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button id="share-btn" className="cta-btn" onClick={handleShare}>
            {shareNote || "Share result"}
          </button>
          <button
            id="practice-btn"
            type="button"
            className="bg-transparent border-none p-0 text-link text-[14px] font-body cursor-pointer"
            onClick={onPractice}
          >
            Play Practice
          </button>
        </div>
      </div>
    </div>
  );
}
