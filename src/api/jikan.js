export async function fetchSuggestions(query) {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&type=tv&limit=5`
  );
  const data = await response.json();

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
