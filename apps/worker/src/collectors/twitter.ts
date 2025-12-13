import { TwitterApi } from 'twitter-api-v2';
import { config } from '../config';

export async function fetchTwitter(source: any): Promise<any[]> {
  if (!config.TWITTER_BEARER_TOKEN) {
    console.log('Twitter API credentials not configured');
    return [];
  }

  const client = new TwitterApi(config.TWITTER_BEARER_TOKEN);

  const items: any[] = [];

  try {
    if (source.handle) {
      // Fetch user timeline
      const username = source.handle.replace('@', '');
      const user = await client.v2.userByUsername(username);

      if (user.data) {
        const tweets = await client.v2.userTimeline(user.data.id, {
          max_results: 100,
          'tweet.fields': ['created_at', 'geo', 'entities', 'referenced_tweets'],
        });

        for (const tweet of tweets.data.data) {
          items.push({
            externalId: tweet.id,
            publishedAt: tweet.created_at,
            raw: tweet,
          });
        }
      }
    } else if (source.query) {
      // Search tweets
      const tweets = await client.v2.search(source.query, {
        max_results: 100,
        'tweet.fields': ['created_at', 'geo', 'entities', 'author_id'],
      });

      for (const tweet of tweets.data.data) {
        items.push({
          externalId: tweet.id,
          publishedAt: tweet.created_at,
          raw: tweet,
        });
      }
    }
  } catch (error) {
    console.error('Twitter API error:', error);
    throw error;
  }

  return items;
}
