import Snoowrap from 'snoowrap';
import { config } from '../config';

export async function fetchReddit(source: any): Promise<any[]> {
  if (!config.REDDIT_CLIENT_ID || !config.REDDIT_CLIENT_SECRET) {
    console.log('Reddit API credentials not configured');
    return [];
  }

  const reddit = new Snoowrap({
    userAgent: config.REDDIT_USER_AGENT,
    clientId: config.REDDIT_CLIENT_ID,
    clientSecret: config.REDDIT_CLIENT_SECRET,
    // Use refresh token or password auth if needed
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const items: any[] = [];

  try {
    if (source.handle) {
      // Fetch subreddit posts
      const subreddit = reddit.getSubreddit(source.handle);
      const posts = await subreddit.getNew({ limit: 100 });

      for (const post of posts) {
        items.push({
          externalId: post.id,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          raw: post,
        });
      }
    } else if (source.query) {
      // Search Reddit
      const results = await reddit.search({
        query: source.query,
        time: 'day',
        limit: 100,
      });

      for (const post of results) {
        items.push({
          externalId: post.id,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          raw: post,
        });
      }
    }
  } catch (error) {
    console.error('Reddit API error:', error);
    throw error;
  }

  return items;
}
