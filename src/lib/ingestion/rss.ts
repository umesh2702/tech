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
    
    return feed.items.map(item => {
      // Prefer full content if available, fallback to description or snippet
      const rawContent = item.contentEncoded || item.content || item.description || item.title || "";
      
      // Clean HTML tags quickly (basic normalization)
      const cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      
      return {
        title: item.title || "Untitled",
        link: item.link || url,
        content: cleanContent,
        publishedAt: item.isoDate ? new Date(item.isoDate) : (item.pubDate ? new Date(item.pubDate) : new Date()),
      };
    });
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return [];
  }
}
