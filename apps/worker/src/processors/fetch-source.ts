import { Job } from 'bullmq';
import { query } from '../db';
import { queues, addJobWithRetry } from '../queues';
import { fetchTwitter } from '../collectors/twitter';
import { fetchReddit } from '../collectors/reddit';
import { fetchRSS } from '../collectors/rss';
import { fetchICAL } from '../collectors/ical';
import { fetchEmail } from '../collectors/email';

export interface FetchSourceJobData {
  sourceId: number;
}

export async function processFetchSource(job: Job<FetchSourceJobData>) {
  const { sourceId } = job.data;

  // Get source details
  const sources = await query(
    `
    SELECT *
    FROM sources
    WHERE id = $1 AND is_active = true
  `,
    [sourceId]
  );

  if (sources.length === 0) {
    console.log(`Source ${sourceId} not found or inactive`);
    return;
  }

  const source = sources[0];
  console.log(`Fetching source: ${source.name} (${source.platform})`);

  try {
    let rawItems: any[] = [];

    // Route to appropriate collector
    switch (source.platform) {
      case 'twitter':
        rawItems = await fetchTwitter(source);
        break;
      case 'reddit':
        rawItems = await fetchReddit(source);
        break;
      case 'rss':
        rawItems = await fetchRSS(source);
        break;
      case 'ical':
        rawItems = await fetchICAL(source);
        break;
      case 'email':
        rawItems = await fetchEmail(source);
        break;
      default:
        console.log(`Unsupported platform: ${source.platform}`);
        return;
    }

    console.log(`Fetched ${rawItems.length} items from ${source.name}`);

    // Insert raw items into database
    for (const item of rawItems) {
      const rawHash = generateHash(JSON.stringify(item.raw));

      // Check if already exists
      const existing = await query(
        `SELECT id FROM raw_items WHERE source_id = $1 AND raw_hash = $2`,
        [sourceId, rawHash]
      );

      if (existing.length > 0) {
        console.log(`Skipping duplicate item: ${item.externalId}`);
        continue;
      }

      // Insert raw item
      const inserted = await query(
        `
        INSERT INTO raw_items (source_id, external_id, published_at, raw, raw_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
        [sourceId, item.externalId, item.publishedAt, JSON.stringify(item.raw), rawHash]
      );

      const rawItemId = inserted[0].id;

      // Enqueue parse job
      await addJobWithRetry(queues.parse, 'PARSE_RAW', {
        rawItemId,
        sourceId,
      });
    }

    // Update source last_fetch_at
    await query(
      `
      UPDATE sources
      SET last_fetch_at = NOW(), last_success_at = NOW(), last_error = NULL
      WHERE id = $1
    `,
      [sourceId]
    );
  } catch (error) {
    console.error(`Error fetching source ${sourceId}:`, error);

    // Update source with error
    await query(
      `
      UPDATE sources
      SET last_fetch_at = NOW(), last_error = $1
      WHERE id = $2
    `,
      [error instanceof Error ? error.message : 'Unknown error', sourceId]
    );

    throw error;
  }
}

function generateHash(input: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input).digest('hex');
}
