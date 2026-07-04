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

// Builds the list of guesses that should count as correct for an anime,
// covering common alternate ways a player might type its name.
function getAllAnimeNames(primaryName, slug) {
  const names = [primaryName];

  // e.g. "attack-on-titan" -> "attack on titan"
  names.push(slug.replace(/-/g, " "));

  // Accept the title without its subtitle, e.g. "Demon Slayer: ..." -> "Demon Slayer"
  if (primaryName.includes(":")) {
    names.push(primaryName.split(":")[0].trim());
  }
  // Accept the title without punctuation, e.g. "Haikyuu!!" -> "Haikyuu"
  if (primaryName.includes("!")) {
    names.push(primaryName.replace(/!/g, "").trim());
  }

  // Accept a common acronym for longer titles, e.g. "Attack on Titan" -> "AoT"
  if (primaryName.split(" ").length >= 3) {
    const abbreviation = primaryName
      .split(" ")
      .map((word) => word[0])
      .join("");
    names.push(abbreviation);
  }

  // Dedupe and lowercase so guesses can be matched case-insensitively.
  return [...new Set(names)]
    .map((name) => name.toLowerCase())
    .filter((name) => name.length > 0);
}

// Fetches opening themes from AnimeThemes.moe and builds the
// { videoUrl: { answers, quality } } map used to drive the online clip source.
export async function fetchAnimeThemes() {
  const response = await fetch(
    "https://api.animethemes.moe/anime?include=animethemes.animethemeentries.videos&filter[has]=animethemes&filter[animetheme][type]=OP&page[size]=100"
  );

  if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

  const { anime } = await response.json();
  const videoClips = {};

  anime.forEach(({ name, slug, animethemes }) => {
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
      const titles = getAllAnimeNames(name, slug);

      videoClips[bestVideo.url] = {
        answers: titles,
        quality: bestVideo.quality,
      };
    }
  });

  return videoClips;
}
