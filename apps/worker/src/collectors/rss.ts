import Parser from 'rss-parser';

export async function fetchRSS(source: any): Promise<any[]> {
  if (!source.url) {
    console.log('RSS source missing URL');
    return [];
  }

  const parser = new Parser();
  const items: any[] = [];

  try {
    const feed = await parser.parseURL(source.url);

    for (const item of feed.items) {
      items.push({
        externalId: item.guid || item.link,
        publishedAt: item.pubDate || item.isoDate,
        raw: item,
      });
    }
  } catch (error) {
    console.error('RSS fetch error:', error);
    throw error;
  }

  return items;
}
