import { fallbackClips } from "../data/fallbackClips";

// Builds suggestions from the bundled clip library, used whenever the online
// lookup fails. Matches the query against every accepted answer for a clip
// but only surfaces the clip's primary title in the dropdown.
function localSuggestions(query) {
  const q = query.toLowerCase();
  const titles = new Set();
  for (const { answers } of Object.values(fallbackClips)) {
    if (answers.some((answer) => answer.toLowerCase().includes(q))) {
      titles.add(answers[0]);
    }
  }

  // Titles that start with the query rank above ones that merely contain it.
  return [...titles]
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b);
    })
    .slice(0, 5)
    .map((title) => ({ title }));
}

// Primary online source: the Jikan (MyAnimeList) API.
async function fetchJikanSuggestions(query) {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&type=tv&limit=5`
  );
  if (!response.ok) throw new Error(`Jikan request failed with status ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.data)) throw new Error("Jikan returned a malformed response");

  const seenTitles = new Set();
  const suggestions = [];
  for (const anime of data.data) {
    const title = anime.title_english || anime.title;
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    suggestions.push({ mal_id: anime.mal_id, title });
  }
  return suggestions;
}

// Secondary online source: the AniList GraphQL API. AniList maintains its own
// anime database, so it stays up during MyAnimeList outages that take Jikan
// down with them. AniList also knows each show's MAL id, so suggestions keep
// the same shape regardless of which source produced them.
async function fetchAniListSuggestions(query) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: `query ($search: String) {
        Page(perPage: 5) {
          media(search: $search, type: ANIME, format: TV) {
            idMal
            title { english romaji }
          }
        }
      }`,
      variables: { search: query },
    }),
  });
  if (!response.ok) throw new Error(`AniList request failed with status ${response.status}`);
  const data = await response.json();
  const media = data?.data?.Page?.media;
  if (!Array.isArray(media)) throw new Error("AniList returned a malformed response");

  const seenTitles = new Set();
  const suggestions = [];
  for (const anime of media) {
    const title = anime.title.english || anime.title.romaji;
    if (!title || seenTitles.has(title)) continue;
    seenTitles.add(title);
    suggestions.push({ mal_id: anime.idMal, title });
  }
  return suggestions;
}

// Looks up anime titles matching the user's partial input. Used to power the
// autocomplete dropdown while typing. Returns up to 5 unique titles,
// preferring the English title when one exists. Tries Jikan first, then
// AniList when Jikan is unreachable, and finally the bundled clip library so
// autocomplete keeps working fully offline.
export async function fetchSuggestions(query) {
  try {
    return await fetchJikanSuggestions(query);
  } catch {
    try {
      return await fetchAniListSuggestions(query);
    } catch {
      return localSuggestions(query);
    }
  }
}
