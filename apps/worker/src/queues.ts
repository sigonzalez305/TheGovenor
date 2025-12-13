import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export enum JobType {
  FETCH_SOURCE = 'FETCH_SOURCE',
  PARSE_RAW = 'PARSE_RAW',
  ENRICH_ML = 'ENRICH_ML',
  GEOCODE = 'GEOCODE',
  CLUSTER = 'CLUSTER',
  EVENT_LINK = 'EVENT_LINK',
  ROLLUP_DAILY = 'ROLLUP_DAILY',
  ROLLUP_WARD_STATUS = 'ROLLUP_WARD_STATUS',
}

// Create queues
export const queues = {
  fetch: new Queue('fetch', { connection }),
  parse: new Queue('parse', { connection }),
  enrich: new Queue('enrich', { connection }),
  geocode: new Queue('geocode', { connection }),
  cluster: new Queue('cluster', { connection }),
  eventLink: new Queue('eventLink', { connection }),
  rollup: new Queue('rollup', { connection }),
};

// Queue events for monitoring
export const queueEvents = {
  fetch: new QueueEvents('fetch', { connection }),
  parse: new QueueEvents('parse', { connection }),
  enrich: new QueueEvents('enrich', { connection }),
};

// Helper to add jobs with retry logic
export async function addJobWithRetry<T = any>(
  queue: Queue,
  name: string,
  data: T,
  opts: any = {}
) {
  return queue.add(name, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    ...opts,
  });
}
