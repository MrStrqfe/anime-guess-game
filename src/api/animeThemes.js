// Ranks video qualities so the highest-resolution clip is preferred when several are available.
const QUALITY_ORDER = { "1080p": 3, "720p": 2, "480p": 1, "360p": 0 };

// Picks the highest-quality clip from a list of openings for the same anime.
function selectBestQualityVideo(videos) {
  return videos.reduce((best, current) => {
    const currentScore = QUALITY_ORDER[current.quality] || 0;
    const bestScore = QUALITY_ORDER[best.quality] || 0;
    return currentScore > bestScore ? current : best;
  }, videos[0]);
}

// Expands one title into the alternate ways a player might type it.
function getTitleVariants(title) {
  const variants = [title];

  // Accept the title without its subtitle, e.g. "Demon Slayer: ..." -> "Demon Slayer"
  if (title.includes(":")) {
    variants.push(title.split(":")[0].trim());
  }
  // Accept the title without punctuation, e.g. "Haikyuu!!" -> "Haikyuu"
  if (title.includes("!")) {
    variants.push(title.replace(/!/g, "").trim());
  }

  // Accept a common acronym for longer titles, e.g. "Attack on Titan" -> "AoT"
  if (title.split(" ").length >= 3) {
    const abbreviation = title
      .split(" ")
      .map((word) => word[0])
      .join("");
    variants.push(abbreviation);
  }

  return variants;
}

// Builds the list of guesses that should count as correct for an anime.
// The primary name from AnimeThemes.moe is the romanized Japanese title
// (e.g. "Shingeki no Kyojin"); synonyms add the official English title
// (e.g. "Attack on Titan") and other alternates, so a guess in either
// language counts. Native-script titles are skipped since nobody types kanji.
function getAllAnimeNames(primaryName, slug, synonyms = []) {
  const titles = [
    primaryName,
    ...synonyms
      .filter((synonym) => synonym.type !== "Native")
      .map((synonym) => synonym.text),
  ];

  const names = titles.flatMap(getTitleVariants);

  // e.g. "attack-on-titan" -> "attack on titan"
  names.push(slug.replace(/-/g, " "));

  // Dedupe and lowercase so guesses can be matched case-insensitively.
  return [...new Set(names.map((name) => name.toLowerCase()))]
    .filter((name) => name.length > 0);
}

// Fetches opening themes from AnimeThemes.moe and builds the
// { videoUrl: { answers, quality, year } } map used to drive the online clip
// source. Pass `year` to only fetch anime that aired that year (year mode).
export async function fetchAnimeThemes({ year = null } = {}) {
  const params = new URLSearchParams({
    include: "animesynonyms,animethemes.animethemeentries.videos",
    "filter[has]": "animethemes",
    "filter[animetheme][type]": "OP",
    "page[size]": "100",
  });
  if (year) params.set("filter[year]", String(year));

  const response = await fetch(`https://api.animethemes.moe/anime?${params}`);

  if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

  const { anime } = await response.json();
  const videoClips = {};

  anime.forEach(({ name, slug, year: animeYear, animethemes, animesynonyms }) => {
    const opVideos = animethemes
      .filter((theme) => theme.type === "OP")
      .flatMap((theme) =>
        theme.animethemeentries.flatMap((entry) =>
          entry.videos
            // Skip versions with overlaid logos/credits so clips stay clean guessing material.
            .filter((video) => video.overlap === "None")
            .map((video) => ({
              url: video.link,
              quality: video.quality || "480p",
            }))
        )
      );

    if (opVideos.length > 0) {
      const bestVideo = selectBestQualityVideo(opVideos);
      const titles = getAllAnimeNames(name, slug, animesynonyms ?? []);

      videoClips[bestVideo.url] = {
        answers: titles,
        quality: bestVideo.quality,
        year: animeYear ?? null,
      };
    }
  });

  return videoClips;
}
