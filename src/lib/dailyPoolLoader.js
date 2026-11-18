// Browser-only loader for the daily pool.
//
// `?url` makes Vite emit dailyPool.json as its own content-hashed file
// (e.g. assets/dailyPool-3f9a1c.json) instead of inlining it in the JS
// bundle. The hash changes only when the pool does, so browsers, the
// GitHub Pages CDN and the service worker can all cache it indefinitely.
// It also downloads in parallel with the app code.
import poolUrl from "../data/dailyPool.json?url";

const MAX_ATTEMPTS = 3;

let poolPromise = null;

// Fetches the pool once per page (every caller shares the same promise), and
// retries transient failures with exponential backoff plus jitter so a
// network blip doesn't break the daily.
export function loadDailyPool() {
  if (!poolPromise) {
    poolPromise = fetchWithRetry().catch((error) => {
      poolPromise = null; // let a later call try again
      throw error;
    });
  }
  return poolPromise;
}

async function fetchWithRetry() {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(poolUrl);
      if (!response.ok) throw new Error(`Daily pool request failed with status ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) throw error;
      const backoff = 500 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff + Math.random() * backoff));
    }
  }
}
