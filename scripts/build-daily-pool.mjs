// Builds src/data/dailyPool.json: the anime the Daily game draws from.
//
//   npm run build:pool
//
// 1. Fetches the 500 most popular TV anime from AniList.
// 2. Drops sequel seasons, so every daily answer is a distinct show.
// 3. Looks up each show's first clean opening on AnimeThemes (GraphQL API).
// 4. Writes { title, answers, hints, videoUrl, ... } for each show that has one.
//
// The result is committed, not fetched at runtime, so every player gets the
// same picks each day. Rebuilding it reshuffles future days (see
// src/lib/daily.js), so only rebuild deliberately.

import { writeFile } from "node:fs/promises";
import { getTitleVariants } from "../src/api/animeThemes.js";

const POOL_SIZE = 500;
const ANILIST_PAGE_SIZE = 50;
const THEMES_BATCH_SIZE = 50;
const OUTPUT = new URL("../src/data/dailyPool.json", import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POSTs a GraphQL query, retrying on rate limits and server errors.
async function graphql(url, query, variables = {}) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "AniBlur-daily-pool-builder",
      },
      body: JSON.stringify({ query, variables }),
    });
    if (response.ok) {
      const body = await response.json();
      if (body.errors) throw new Error(JSON.stringify(body.errors));
      return body.data;
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= 5) {
      throw new Error(`${url} failed with status ${response.status}`);
    }
    const wait = Number(response.headers.get("retry-after")) * 1000 || 2000 * attempt;
    console.warn(`  ${response.status} from ${url}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
}

const ANILIST_QUERY = `query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, format: TV, sort: POPULARITY_DESC) {
      id
      idMal
      popularity
      title { english romaji }
      synonyms
      genres
      season
      seasonYear
      episodes
      studios(isMain: true) { nodes { name } }
      characters(role: MAIN, sort: [ROLE, RELEVANCE, ID], perPage: 1) {
        nodes { name { first last full } }
      }
      relations { edges { relationType node { type format } } }
    }
  }
}`;

async function fetchTopAnime() {
  const all = [];
  for (let page = 1; all.length < POOL_SIZE; page++) {
    const data = await graphql("https://graphql.anilist.co", ANILIST_QUERY, {
      page,
      perPage: ANILIST_PAGE_SIZE,
    });
    all.push(...data.Page.media);
    console.log(`AniList: ${all.length} anime`);
    await sleep(1000);
  }
  return all.slice(0, POOL_SIZE);
}

// A sequel season has a TV/ONA prequel. Spin-offs and side stories are
// separate shows and stay in.
const SERIES_FORMATS = new Set(["TV", "TV_SHORT", "ONA"]);
function isSequel(media) {
  return media.relations.edges.some(
    (edge) =>
      edge.relationType === "PREQUEL" &&
      edge.node.type === "ANIME" &&
      SERIES_FORMATS.has(edge.node.format)
  );
}

const THEMES_QUERY = `query ($ids: [Int!]) {
  findAnimeByExternalSite(site: ANILIST, id: $ids) {
    slug
    title { romaji english }
    synonyms { text }
    resources { nodes { site externalId } }
    animethemes {
      type
      sequence
      animethemeentries {
        spoiler
        nsfw
        videos { nodes { link resolution overlap lyrics } }
      }
    }
  }
}`;

// Returns Map<anilistId, AnimeThemes anime>.
async function fetchThemes(anilistIds) {
  const byAnilistId = new Map();
  for (let i = 0; i < anilistIds.length; i += THEMES_BATCH_SIZE) {
    const ids = anilistIds.slice(i, i + THEMES_BATCH_SIZE);
    const data = await graphql("https://graphql.animethemes.moe/", THEMES_QUERY, { ids });
    for (const anime of data.findAnimeByExternalSite) {
      for (const resource of anime.resources.nodes) {
        if (resource.site === "ANILIST" && ids.includes(resource.externalId)) {
          byAnilistId.set(resource.externalId, anime);
        }
      }
    }
    console.log(`AnimeThemes: looked up ${Math.min(i + ids.length, anilistIds.length)}/${anilistIds.length}`);
    await sleep(1000);
  }
  return byAnilistId;
}

// The earliest opening (usually the iconic OP1) with a clean video: no
// spoiler/NSFW flags, no credits overlay, no burned-in lyrics. Prefers 720p,
// which loads faster than 1080p and is plenty under a blur.
function pickOpVideo(anime) {
  const openings = anime.animethemes
    .filter((theme) => theme.type === "OP")
    .sort((a, b) => (a.sequence ?? 1) - (b.sequence ?? 1));

  for (const theme of openings) {
    const videos = theme.animethemeentries
      .filter((entry) => !entry.spoiler && !entry.nsfw)
      .flatMap((entry) => entry.videos.nodes)
      .filter((video) => video.overlap === "NONE" && !video.lyrics);
    if (videos.length === 0) continue;
    const rank = (v) => (v.resolution === 720 ? 0 : v.resolution === 1080 ? 1 : 2);
    return videos.sort((a, b) => rank(a) - rank(b))[0].link;
  }
  return null;
}

// Nobody types kanji or hangul; keep only Latin-script titles.
const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u;

// Drops "Season 2" / "(2011)" / "(TV)" suffixes so the base name also counts.
function stripSeason(title) {
  return title
    .replace(/\s*\((TV|\d{4})\)\s*$/i, "")
    .replace(/\s*(season|part|cour)\s*\d+.*$/i, "")
    .replace(/\s*\d+(st|nd|rd|th)\s+season.*$/i, "")
    .trim();
}

// Main English/romaji titles get the full variant treatment (subtitle-less,
// acronym, ...); synonyms (often other languages) are accepted as written.
function buildAnswers(media, themes) {
  const usable = (title) => title && LATIN_ONLY.test(title);
  const mainTitles = [
    media.title.english,
    media.title.romaji,
    themes.title?.english,
    themes.title?.romaji,
  ].filter(usable);
  const synonyms = [...media.synonyms, ...themes.synonyms.map((s) => s.text)].filter(usable);

  const variants = [
    ...mainTitles.flatMap((title) => [...getTitleVariants(title.trim()), stripSeason(title)]),
    ...synonyms.map((title) => title.trim()),
    themes.slug.replace(/_/g, " "),
  ];

  const seen = new Set();
  return variants.filter((answer) => {
    const key = answer.toLowerCase().trim();
    if (key.length < 2 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// A name part "leaks" if it appears in any accepted answer (Naruto, Frieren,
// Mob, ...). Leaky parts are shortened to an initial.
function maskName(name, answers) {
  const lowered = answers.map((answer) => answer.toLowerCase());
  const leaks = (part) => lowered.some((answer) => answer.includes(part.toLowerCase()));
  const short = (part) => `${part[0]}.`;
  const first = name.first?.trim();
  const last = name.last?.trim();
  if (first && last) return `${short(first)} ${leaks(last) ? short(last) : last}`;
  const only = first || last || name.full?.trim();
  if (!only) return null;
  return leaks(only) ? short(only) : only;
}

const titleCase = (word) => word[0] + word.slice(1).toLowerCase();

// Two short clues revealed as the daily's clip gets longer:
//   1. genres + season, e.g. "Action · Sports · Fall 2022"
//   2. studio + main character, e.g. "Studio 8bit · Main character: Y. Isagi"
// Either falls back to the episode count when AniList has no data for it.
export function buildHints(media, answers) {
  const episodes = media.episodes ? `${media.episodes} episodes` : "TV series";
  const season = [media.season && titleCase(media.season), media.seasonYear]
    .filter(Boolean)
    .join(" ");
  const hint1 = [...(media.genres ?? []).slice(0, 3), season].filter(Boolean).join(" · ");

  const studio = media.studios?.nodes?.[0]?.name;
  const character = media.characters?.nodes?.[0]?.name;
  const mainCharacter = character && maskName(character, answers);
  // "Studio Pierrot" / "WIT STUDIO" already say it; others get the prefix.
  const studioLabel = studio && (/studio/i.test(studio) ? studio : `Studio ${studio}`);
  const hint2 = [studioLabel, mainCharacter && `Main character: ${mainCharacter}`]
    .filter(Boolean)
    .join(" · ");

  return [hint1 || episodes, hint2 || episodes];
}

async function main() {
  const top = await fetchTopAnime();
  const originals = top.filter((media) => !isSequel(media));
  console.log(`${originals.length} of ${top.length} are first seasons / standalone shows`);

  const themes = await fetchThemes(originals.map((media) => media.id));

  const pool = [];
  const skipped = [];
  for (const media of originals) {
    const anime = themes.get(media.id);
    const videoUrl = anime && pickOpVideo(anime);
    const title = media.title.english || media.title.romaji;
    if (!videoUrl) {
      skipped.push(title);
      continue;
    }
    const answers = buildAnswers(media, anime);
    pool.push({
      anilistId: media.id,
      malId: media.idMal,
      title,
      answers,
      hints: buildHints(media, answers),
      videoUrl,
    });
  }

  await writeFile(OUTPUT, JSON.stringify(pool, null, 1) + "\n");
  console.log(`\nWrote ${pool.length} anime to src/data/dailyPool.json`);
  if (skipped.length) console.log(`Skipped ${skipped.length} with no clean opening: ${skipped.join(", ")}`);
}

// Only build when run directly (the hint helpers are imported by checks).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
