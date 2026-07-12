// Static page header: Apple-style wordmark + quiet tagline. No props or
// state. `anime-header` stays as a class hook for the short-window
// (max-height) rules in styles.css.
export default function Header() {
  return (
    <header className="anime-header relative z-10 text-center mb-[clamp(0.6rem,2vh,1.6rem)] max-phone:px-[56px]">
      <div className="flex items-center justify-center gap-3">
        <img
          src="/images/AniBlur.avif"
          alt="AniBlur Logo"
          className="w-10 h-10 rounded-full"
        />

        <h1 className="font-semibold tracking-[-0.03em] leading-[1.1] text-light text-[clamp(26px,3.4vw,34px)]">
          AniBlur
        </h1>
      </div>

      <h3 className="mt-1.5 font-normal tracking-[-0.01em] text-dim text-[clamp(14px,1.6vw,17px)]">
        Name the anime from its opening.
      </h3>
    </header>
  );
}
