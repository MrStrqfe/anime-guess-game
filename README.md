# AniBlur (Anime Guess Game)

An interactive web game that challenges users to identify anime series by watching short, blurred opening video clips. Perfect for anime fans who want to test their knowledge and recognition skills!

---

## Table of Contents

- Overview
- Features
- How to Play
- Accounts & Personal Stats
- Project Structure
- Technologies Used
- Development
- Supabase Setup (for your own deployment)
- Planned Features
- Contributing
- License

---

## Overview

**Anime Guess Game** is a web-based trivia game where players watch the opening of an anime (blurred for added difficulty) and guess the anime's name. Each round features a new clip, and users earn points for each correct answer. The game currently uses both local and online databases for anime openings and supports multiple answers per video. Players can optionally create an account to track their personal stats across sessions and devices.

---

## Features

- Guess anime by watching opening clips.
- Blurred videos for increased challenge.
- Three guesses allowed per video.
- Point system with score and accuracy at the end.
- **Optional accounts** (email/password or Google/Discord) with persistent personal stats: games played, total correct, best score, average score, accuracy, and correct-answer streaks.
- Guest play fully supported — signing in is never required.
- Option to toggle between local and online databases for anime openings.
- Input suggestions (autocomplete) for anime titles, with automatic failover across two independent APIs (Jikan, then AniList) plus a bundled offline list — suggestions keep working even during MyAnimeList outages.
- Forgiving answer matching: guesses are case- and punctuation-insensitive (e.g. "hells paradise" counts for *Hell's Paradise*), and clips accept multiple titles/spellings (e.g. both "Haikyu!!" and "Haikyuu").
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

## Accounts & Personal Stats

Sign in from the top-right corner (email/password, Google, or Discord). When signed in, every finished game is recorded to your profile and viewable under **My Stats**:

- **Games played**, **total correct**, and **best score** (best score only counts full 10-question games)
- **Average score** and **accuracy**
- **Current and longest streak** — streaks count consecutive correct rounds and carry across games; a missed round resets the current streak

Stats are stored in [Supabase](https://supabase.com) (Postgres + auth). All stat aggregation happens server-side in a database function — the client can only report a game's round results, never write stats directly. Guests can always play; their results just aren't saved.

---

## Project Structure

anime-guess-game\
├── index.html # Vite entry point\
├── src/\
│&nbsp;&nbsp;&nbsp;├── main.jsx # React entry point (wraps App in AuthProvider)\
│&nbsp;&nbsp;&nbsp;├── App.jsx # Top-level composition, video ref, keyboard shortcuts, stat recording\
│&nbsp;&nbsp;&nbsp;├── styles.css # UI and layout styles\
│&nbsp;&nbsp;&nbsp;├── data/ # Local fallback clip/answer data\
│&nbsp;&nbsp;&nbsp;├── api/ # AnimeThemes.moe, Jikan/AniList autocomplete, and stats (Supabase) calls\
│&nbsp;&nbsp;&nbsp;├── context/ # AuthContext (session state, sign in/up/out)\
│&nbsp;&nbsp;&nbsp;├── lib/ # Supabase client setup\
│&nbsp;&nbsp;&nbsp;├── hooks/ # Game state (score, guesses, rounds)\
│&nbsp;&nbsp;&nbsp;└── components/ # UI components (video player, popups, auth, stats, etc.)\
├── public/videos/ # Local video clips used in the game\
├── supabase/schema.sql # Database schema: profiles table, RLS, record_game function\
└── README.md # Documentation and development notes

---

## Technologies Used

- **React** + **Vite**: UI and build tooling
- **Supabase**: authentication (email + OAuth) and Postgres-backed stat storage
- Anime opening data fetched via public APIs:
  - [AnimeThemes.moe API](https://animethemes.moe/)
  - [Jikan.moe API](https://jikan.moe/) (primary autocomplete source)
  - [AniList GraphQL API](https://docs.anilist.co/) (autocomplete fallback when Jikan/MyAnimeList is down)

---

## Development

```bash
npm install
npm run dev      # start the local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

To enable accounts locally, copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon key. Without these, the game runs in guest-only mode (no sign-in UI) — everything else works normally.

---

## Supabase Setup (for your own deployment)

1. Create a free project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` once in the SQL Editor — it creates the `profiles` table, row-level security policies, a signup trigger, and the `record_game` function (the only write path for stats).
3. **Authentication → Sign In / Providers**: Email is enabled by default (turning *Confirm email* off is recommended unless you configure custom SMTP — the built-in email service is heavily rate-limited). For Google/Discord, create OAuth apps pointing at `https://<project-ref>.supabase.co/auth/v1/callback` and paste their credentials in.
4. **Authentication → URL Configuration**: set the Site URL to your deployed URL and add `http://localhost:5173/**` plus `https://<your-site>/**` to the redirect allowlist.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets so the deploy workflow builds with them (see `.github/workflows/deploy.yml`). The anon key is safe to expose in the client bundle; row-level security is the access boundary.

---

## Planned Features

- Fix and enhance the Finish Game screen.
- Expand the local clip set; increase total rounds (score out of 10).
- Add a symbol to indicate Easy/Medium/Hard difficulty for each clip.
- Experimental: Audio-only mode for bonus points.
- Leaderboards comparing stats across players.
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
[Play Anime Guess Game](https://mrstrqfe.github.io/anime-guess-game/)
