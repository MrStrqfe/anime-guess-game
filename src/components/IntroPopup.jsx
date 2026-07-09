// "How to Play" popup shown before the first game, and reopenable later via
// the help button. `resume` swaps the button label when a game is already
// running (closing just returns to it instead of starting a new one).
export default function IntroPopup({ onStart, resume = false }) {
  return (
    <div id="intro-popup" className="popup">
      <div className="popup-content anime-popup">
        <div className="popup-header">
          <h2>
            How to Play <i className="fas fa-gamepad"></i>
          </h2>
        </div>
        <ol
          className="text-left my-[1.2rem] mx-auto max-w-[92%] list-none
            [&>li]:mb-[0.6rem] [&>li]:px-3.5 [&>li]:py-2.5 [&>li]:bg-[rgba(140,170,255,0.05)]
            [&>li]:border [&>li]:border-transparent [&>li]:border-l-2 [&>li]:border-l-primary
            [&>li]:rounded-md [&>li]:flex [&>li]:items-center [&>li]:gap-2.5 [&>li]:text-[0.95rem]
            [&>li]:transition-[background-color,transform] [&>li]:duration-200
            [&>li:hover]:bg-[rgba(140,170,255,0.1)] [&>li:hover]:translate-x-1
            [&_i]:text-primary [&_i]:w-5 [&_i]:text-center"
        >
          <li>
            <i className="fas fa-eye"></i> Watch the blurred anime opening
          </li>
          <li>
            <i className="fas fa-question"></i> Guess which anime it's from
          </li>
          <li>
            <i className="fas fa-paper-plane"></i> Submit your answer
          </li>
          <li>
            <i className="fas fa-star"></i> Correct guesses reveal the video and
            earn points!
          </li>
          <li>
            <i className="fas fa-exclamation"></i> You get 3 guesses per video!
          </li>
        </ol>
        <button id="start-game-btn" className="start-btn neon-btn" onClick={onStart}>
          <span>{resume ? "Back to Game" : "Start Game"}</span>
          <i className={`fas ${resume ? "fa-arrow-right" : "fa-play"}`}></i>
        </button>
      </div>
    </div>
  );
}
