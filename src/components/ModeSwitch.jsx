// Daily | Practice segmented control under the header. Same pill styling as
// the Featured/Library control in ActionButtons.
const segmentBase =
  "px-4 py-1.5 rounded-[980px] border-none font-body text-[14px] tracking-[-0.01em] " +
  "cursor-pointer transition-[background-color,color] duration-[250ms]";

export default function ModeSwitch({ mode, onChange }) {
  const modes = [
    { id: "daily", label: "Daily" },
    { id: "practice", label: "Practice" },
  ];

  return (
    <div className="relative z-10 flex justify-center mb-[clamp(0.6rem,2vh,1.2rem)]">
      <div
        className="flex bg-fill border border-line-soft rounded-[980px] p-0.5"
        role="group"
        aria-label="Game mode"
      >
        {modes.map(({ id, label }) => {
          const selected = mode === id;
          return (
            <button
              key={id}
              id={`mode-${id}-btn`}
              aria-pressed={selected}
              className={`${segmentBase} ${
                selected ? "bg-fill-selected text-light font-medium" : "bg-transparent text-dim"
              }`}
              onClick={() => !selected && onChange(id)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
