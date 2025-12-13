import { Job } from 'bullmq';
import { query } from '../db';
import { queues, addJobWithRetry } from '../queues';

export interface ParseRawJobData {
  rawItemId: number;
  sourceId: number;
}

export async function processParseRaw(job: Job<ParseRawJobData>) {
  const { rawItemId, sourceId } = job.data;

  // Get raw item
  const rawItems = await query(`SELECT * FROM raw_items WHERE id = $1`, [rawItemId]);

  if (rawItems.length === 0) {
    console.log(`Raw item ${rawItemId} not found`);
    return;
  }

  const rawItem = rawItems[0];

  // Get source
  const sources = await query(`SELECT * FROM sources WHERE id = $1`, [sourceId]);
  const source = sources[0];

  try {
    // Parse based on platform
    let signal: any = {};

    switch (source.platform) {
      case 'twitter':
        signal = parseTwitter(rawItem.raw, source);
        break;
      case 'reddit':
        signal = parseReddit(rawItem.raw, source);
        break;
      case 'rss':
        signal = parseRSS(rawItem.raw, source);
        break;
      case 'ical':
        signal = parseICAL(rawItem.raw, source);
        break;
      case 'email':
        signal = parseEmail(rawItem.raw, source);
        break;
      default:
        console.log(`Unsupported platform for parsing: ${source.platform}`);
        return;
    }

    // Insert signal
    const inserted = await query(
      `
      INSERT INTO signals (
        source_id, raw_item_id, timestamp, title, body, author, platform, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        sourceId,
        rawItemId,
        signal.timestamp,
        signal.title,
        signal.body,
        signal.author,
        source.platform,
        signal.tags || [],
      ]
    );

    const signalId = inserted[0].id;

    // Update raw_item status
    await query(`UPDATE raw_items SET ingest_status = 'PARSED' WHERE id = $1`, [rawItemId]);

    // Enqueue ML enrichment
    await addJobWithRetry(queues.enrich, 'ENRICH_ML', { signalId });

    // Enqueue geocoding if we have location hints
    if (signal.placeText) {
      await addJobWithRetry(queues.geocode, 'GEOCODE', { signalId, placeText: signal.placeText });
    }
  } catch (error) {
    console.error(`Error parsing raw item ${rawItemId}:`, error);
    await query(`UPDATE raw_items SET ingest_status = 'FAILED', error = $1 WHERE id = $2`, [
      error instanceof Error ? error.message : 'Unknown error',
      rawItemId,
    ]);
    throw error;
  }
}

function parseTwitter(raw: any, source: any): any {
  return {
    timestamp: raw.created_at || new Date().toISOString(),
    title: null,
    body: raw.text || '',
    author: raw.author_id || null,
    tags: raw.entities?.hashtags?.map((h: any) => h.tag) || [],
    placeText: raw.geo?.place_id || null,
  };
}

function parseReddit(raw: any, source: any): any {
  return {
    timestamp: new Date(raw.created_utc * 1000).toISOString(),
    title: raw.title || null,
    body: raw.selftext || raw.body || '',
    author: raw.author || null,
    tags: [],
    placeText: null,
  };
}

function parseRSS(raw: any, source: any): any {
  return {
    timestamp: raw.pubDate || raw.isoDate || new Date().toISOString(),
    title: raw.title || null,
    body: raw.contentSnippet || raw.content || '',
    author: raw.creator || null,
    tags: raw.categories || [],
    placeText: null,
  };
}

function parseICAL(raw: any, source: any): any {
  return {
    timestamp: raw.startDate,
    title: raw.summary || null,
    body: raw.description || '',
    author: null,
    tags: ['event', 'calendar'],
    placeText: raw.location || null,
  };
}

function parseEmail(raw: any, source: any): any {
  return {
    timestamp: raw.date || new Date().toISOString(),
    title: raw.subject || null,
    body: raw.text || '',
    author: raw.from || null,
    tags: ['email'],
    placeText: null,
  };
}
