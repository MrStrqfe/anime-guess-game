const QUALITY_ORDER = { "1080p": 3, "720p": 2, "480p": 1, "360p": 0 };

function selectBestQualityVideo(videos) {
  return videos.reduce((best, current) => {
    const currentScore = QUALITY_ORDER[current.quality] || 0;
    const bestScore = QUALITY_ORDER[best.quality] || 0;
    return currentScore > bestScore ? current : best;
  }, videos[0]);
}

function getAllAnimeNames(primaryName, slug) {
  const names = [primaryName];

  names.push(slug.replace(/-/g, " "));

  if (primaryName.includes(":")) {
    names.push(primaryName.split(":")[0].trim());
  }
  if (primaryName.includes("!")) {
    names.push(primaryName.replace(/!/g, "").trim());
  }

  if (primaryName.split(" ").length >= 3) {
    const abbreviation = primaryName
      .split(" ")
      .map((word) => word[0])
      .join("");
    names.push(abbreviation);
  }

  return [...new Set(names)]
    .map((name) => name.toLowerCase())
    .filter((name) => name.length > 0);
}

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
