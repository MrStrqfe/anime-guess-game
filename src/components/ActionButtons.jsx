// The Submit button, the local/online clip-source toggle, and the year
// filter. Purely presentational — submit, source-switch, and year-select
// logic all live in App.

// Selectable years: current year down to 2000. AnimeThemes.moe coverage gets
// thin before that, and "No clips found" toasts handle any empty year anyway.
const YEARS = Array.from(
  { length: new Date().getFullYear() - 2000 + 1 },
  (_, i) => new Date().getFullYear() - i
);

// Shared shell for the solid gradient action buttons (Submit / Next).
const actionBtnClasses =
  "font-body font-semibold text-[0.95rem] text-white border-none cursor-pointer " +
  "px-[26px] py-[11px] max-phone:px-[22px] max-phone:py-3 inline-flex items-center gap-2 corner-cut " +
  "transition-[filter,transform] duration-200 hover:brightness-115 hover:-translate-y-px active:translate-y-0 " +
  "[&_i]:text-[0.85rem]";

export default function ActionButtons({
  submitVisible,
  onSubmit,
  usingOnlineClips,
  sourceLoading,
  onToggleSource,
  selectedYear,
  onSelectYear,
}) {
  return (
    <>
      <div className="flex gap-2.5 items-center">
        <button
          id="submit-btn"
          className={`${actionBtnClasses} bg-linear-135/srgb from-primary to-[#c81e64] ${submitVisible ? "" : "hidden"}`}
          onClick={onSubmit}
        >
          <i className="fas fa-check"></i> Submit
        </button>
        <button id="next-btn" className={`${actionBtnClasses} bg-linear-135/srgb from-accent to-[#0f7fb3] hidden`}>
          <i className="fas fa-forward"></i> Next
        </button>
      </div>

      <div className="flex gap-2.5 items-center max-phone:flex-wrap max-phone:justify-center">
        {/* Year filter: picking a year fetches that year's openings from the
            online library; "All years" returns to the local clips. */}
        <div className="relative">
          <select
            id="year-select"
            aria-label="Filter anime by year"
            className={`${sourceControlClasses} appearance-none pr-9 [color-scheme:dark]
              [&>option]:bg-panel-solid [&>option]:text-light`}
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
          <i
            className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2
              text-accent text-[0.7rem] pointer-events-none"
          ></i>
        </div>

        <button
          id="clip-source-btn"
          className={sourceControlClasses}
          disabled={sourceLoading}
          onClick={onToggleSource}
        >
          {sourceLoading ? (
            <>
              <span className="icon">⏳</span> Loading...
            </>
          ) : usingOnlineClips ? (
            <>
              <span className="icon">💾</span> Use Local Clips
            </>
          ) : (
            <>
              <i className="fas fa-globe"></i> Use Online Database
            </>
          )}
        </button>
      </div>
    </>
  );
}

// Shared cyan HUD shell for the clip-source controls (toggle + year select).
const sourceControlClasses =
  "inline-flex items-center gap-2 px-[18px] py-[9px] text-[0.88rem] font-body bg-transparent " +
  "text-accent border border-[rgba(41,216,255,0.45)] corner-cut cursor-pointer " +
  "transition-[background-color,box-shadow] duration-200 " +
  "hover:bg-[rgba(41,216,255,0.1)] hover:shadow-[0_0_16px_rgba(41,216,255,0.2)] " +
  "disabled:opacity-60 disabled:cursor-wait";
