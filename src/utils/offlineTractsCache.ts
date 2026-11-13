import { TractItem } from '../data/defaultSiteContent';

const OFFLINE_CACHE_NAME = 'ministry-tracts-offline-v1';

export async function cacheMinistryArticlesOffline(articles: TractItem[]): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return [];
  }

  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const cachedIds: string[] = [];

    for (const article of articles) {
      const url = `/offline-tracts/${encodeURIComponent(article.id)}.json`;
      const response = new Response(JSON.stringify(article), {
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Cached-At': new Date().toISOString(),
        },
      });
      await cache.put(url, response);
      cachedIds.push(article.id);
    }

    await cache.put(
      '/offline-tracts/index.json',
      new Response(JSON.stringify({ count: cachedIds.length, ids: cachedIds }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    return cachedIds;
  } catch {
    return [];
  }
}

export async function getCachedArticleIds(): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return [];
  }

  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const keys = await cache.keys();
    return keys
      .map((req) => {
        const match = req.url.match(/\/offline-tracts\/([^/]+)\.json$/);
        if (!match || match[1] === 'index') return null;
        return decodeURIComponent(match[1]);
      })
      .filter((id): id is string => id !== null);
  } catch {
    return [];
  }
}

export async function removeArticleFromOfflineCache(articleId: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    await cache.delete(`/offline-tracts/${encodeURIComponent(articleId)}.json`);
  } catch {
    // ignore
  }
}
