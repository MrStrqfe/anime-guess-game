# Anime Guess Game

An interactive web game that challenges users to identify anime series by watching short, blurred opening video clips. Perfect for anime fans who want to test their knowledge and recognition skills!

---

## Table of Contents

- Overview
- Features
- How to Play
- Project Structure
- Technologies Used
- Planned Features
- Contributing
- License

---

## Overview

**Anime Guess Game** is a web-based trivia game where players watch the opening of an anime (blurred for added difficulty) and guess the anime's name. Each round features a new clip, and users earn points for each correct answer. The game currently uses both local and online databases for anime openings and supports multiple answers per video.

---

## Features

- Guess anime by watching opening clips.
- Blurred videos for increased challenge.
- Three guesses allowed per video.
- Point system with score and accuracy at the end.
- Option to toggle between local and online databases for anime openings.
- Input suggestions (autocomplete) for anime titles.
- Responsive, modern UI.
- Volume and mute controls, keyboard shortcuts, and accessibility.
- Planned difficulty indicator (Easy/Medium/Hard) per clip.

---

## How to Play

1. Click **Start Game**.
2. Watch the blurred anime opening.
3. Enter your guess in the input field (autocomplete supported).
4. Submit your guess.
   - If correct: the blur is removed, and you earn a point.
   - If incorrect: retry up to three times.
5. Proceed to the next clip until all rounds are complete.
6. View your final score and accuracy!

**Additional controls:**  
- Press **Space** to play/pause the video.
- Use **Left/Right arrows** to adjust volume.
- Press **R** to restart the video, **M** to mute.

---

## Project Structure

anime-guess-game\
├── index.html # Vite entry point\
├── src/\
│&nbsp;&nbsp;&nbsp;├── main.jsx # React entry point\
│&nbsp;&nbsp;&nbsp;├── App.jsx # Top-level composition, video ref, keyboard shortcuts\
│&nbsp;&nbsp;&nbsp;├── styles.css # UI and layout styles\
│&nbsp;&nbsp;&nbsp;├── data/ # Local fallback clip/answer data\
│&nbsp;&nbsp;&nbsp;├── api/ # AnimeThemes.moe and Jikan API calls\
│&nbsp;&nbsp;&nbsp;├── hooks/ # Game state (score, guesses, rounds)\
│&nbsp;&nbsp;&nbsp;└── components/ # UI components (video player, popups, controls, etc.)\
├── public/videos/ # Local video clips used in the game\
└── README.md # Documentation and development notes


---

## Technologies Used

- **React** + **Vite**: UI and build tooling
- Anime opening data fetched via public APIs:
  - [AnimeThemes.moe API](https://animethemes.moe/)
  - [Jikan.moe API](https://jikan.moe/) (for autocomplete)

---

## Development

```bash
npm install
npm run dev      # start the local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

---

## Planned Features

- Fix and enhance the Finish Game screen.
- Expand the local clip set; increase total rounds (score out of 10).
- Add a symbol to indicate Easy/Medium/Hard difficulty for each clip.
- Experimental: Audio-only mode for bonus points.
- Optional: User login and persistent score tracking.
- Polish and refactor UI for accessibility and user experience.

---

## Contributing

Pull requests and feature suggestions are welcome! To contribute:

1. Fork this repository.
2. Create a feature branch.
3. Commit your changes with clear messages.
4. Open a pull request describing your contribution.

---

## License

This project is licensed under the MIT License.

---

**Live Demo:**  
[Play Anime Guess Game](https://mrstrqfe-anime-game.vercel.app/)
