import Parser from 'rss-parser';

export interface ParsedArticle {
  title: string;
  link: string;
  content: string;
  publishedAt: Date;
}

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['description', 'description']
    ]
  }
});

export async function fetchRssFeed(url: string): Promise<ParsedArticle[]> {
  try {
    const feed = await parser.parseURL(url);

    const total = feed.items.length;
    const articles: ParsedArticle[] = [];

    for (const item of feed.items) {
      // CRITICAL FIX: Do NOT fall back to the feed URL when item.link is missing.
      // The original code was:  link: item.link || url
      // When item.link is absent, every such article shared the feed URL as its
      // sourceUrl. The first one got inserted; every subsequent one — across ALL
      // future runs — was rejected by the URL exact-match dedup as a duplicate.
      // This permanently blocked ingestion for any feed that emits link-less items.
      const link = item.link?.trim();
      if (!link) {
        console.warn(`[RSS] Skipping item with no link — title: "${item.title}" — feed: ${url}`);
        continue;
      }

      // Prefer full content if available, fallback to description or snippet
      const rawContent = (item as any).contentEncoded || item.content || item.description || item.title || "";

      // Strip HTML tags and normalise whitespace
      const cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

      articles.push({
        title: item.title || "Untitled",
        link,
        content: cleanContent,
        publishedAt: item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date(),
      });
    }

    console.log(`[RSS] Feed "${url}" — ${total} items fetched, ${articles.length} with valid links`);
    return articles;
  } catch (error) {
    console.error(`[RSS] Error parsing feed ${url}:`, error);
    return [];
  }
}
