import Icon, { PATHS } from "./icons";

// Clip-source controls: a Featured/Library segmented control (local clips
// vs. the AnimeThemes.moe library) and the year filter. Purely
// presentational — source-switch and year-select logic live in App.

// Selectable years: current year down to 2000. AnimeThemes.moe coverage gets
// thin before that, and "No clips found" toasts handle any empty year anyway.
const YEARS = Array.from(
  { length: new Date().getFullYear() - 2000 + 1 },
  (_, i) => new Date().getFullYear() - i
);

const segmentBase =
  "px-3.5 py-1.5 rounded-[980px] border-none font-body text-[13px] tracking-[-0.01em] " +
  "cursor-pointer transition-[background-color,color] duration-[250ms] " +
  "disabled:opacity-60 disabled:cursor-wait";

function segmentClasses(selected) {
  return `${segmentBase} ${
    selected ? "bg-fill-selected text-light font-medium" : "bg-transparent text-dim font-normal"
  }`;
}

export default function ActionButtons({
  usingOnlineClips,
  sourceLoading,
  onToggleSource,
  selectedYear,
  onSelectYear,
}) {
  // Clicking the segment that isn't active switches the source; clicking the
  // active one is a no-op. `clip-source-btn` stays as the id of whichever
  // segment performs the switch, preserving the E2E contract that clicking
  // #clip-source-btn toggles local/online.
  const switchProps = {
    id: "clip-source-btn",
    disabled: sourceLoading,
    onClick: onToggleSource,
  };

  return (
    <div className="flex gap-2.5 items-center flex-wrap max-phone:justify-center">
      <div
        className="flex bg-fill border border-line-soft rounded-[980px] p-0.5"
        role="group"
        aria-label="Clip source"
      >
        <button
          className={segmentClasses(!usingOnlineClips)}
          {...(usingOnlineClips ? switchProps : { disabled: sourceLoading })}
        >
          Featured
        </button>
        <button
          className={segmentClasses(usingOnlineClips)}
          {...(usingOnlineClips ? { disabled: sourceLoading } : switchProps)}
        >
          Library
        </button>
      </div>

      {/* Year filter: picking a year fetches that year's openings from the
          online library; "All years" returns to the local clips. */}
      <div className="relative">
        <select
          id="year-select"
          aria-label="Filter anime by year"
          className="appearance-none py-[7px] pl-3.5 pr-[30px] rounded-[980px] bg-fill
            border border-line-soft text-light font-body text-[13px] tracking-[-0.01em]
            cursor-pointer disabled:opacity-60 disabled:cursor-wait [color-scheme:dark]"
          value={selectedYear ?? ""}
          disabled={sourceLoading}
          onChange={(e) => onSelectYear(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">All years</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <span className="absolute right-[11px] top-1/2 -translate-y-1/2 pointer-events-none flex">
          <Icon path={PATHS.chevronDown} size={12} fill="#86868b" />
        </span>
      </div>
    </div>
  );
}
