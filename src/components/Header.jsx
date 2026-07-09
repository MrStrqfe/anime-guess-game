// Static page header: title, tagline, and decorative dots. No props or state.
// `anime-header` / `header-decoration` stay as class hooks for the
// short-window (max-height) rules that remain in styles.css.
export default function Header() {
  return (
    <header className="anime-header relative z-10 text-center mb-[clamp(0.5rem,1.6vh,1.25rem)] max-phone:px-[72px]">
      <h1 className="font-display font-bold uppercase tracking-[0.06em] leading-[1.15] text-[clamp(1.4rem,1rem_+_2.2vw,2.4rem)] max-phone:text-[1.25rem]">
        <span className="bg-linear-90/srgb from-primary via-secondary via-55% to-accent bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,46,126,0.35)]">
          AniBlur
        </span>
      </h1>
      <h3 className="mt-[0.2rem] font-normal text-dim text-[clamp(0.8rem,0.7rem_+_0.5vw,1rem)]">
        Can you recognize the anime from its opening?
      </h3>
      <div className="header-decoration mt-[0.55rem] flex justify-center gap-2">
        <div className="w-[34px] h-[3px] rounded-[2px] bg-linear-90/srgb from-primary to-accent opacity-80"></div>
        <div className="w-[34px] h-[3px] rounded-[2px] bg-linear-90/srgb from-primary to-accent opacity-50"></div>
        <div className="w-[34px] h-[3px] rounded-[2px] bg-linear-90/srgb from-primary to-accent opacity-25"></div>
      </div>
    </header>
  );
}
