import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from './config';
import { processFetchSource } from './processors/fetch-source';
import { processParseRaw } from './processors/parse-raw';

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log('Starting DC Internet Listener Workers...');

// Fetch worker
const fetchWorker = new Worker('fetch', processFetchSource, {
  connection,
  concurrency: 5,
});

// Parse worker
const parseWorker = new Worker('parse', processParseRaw, {
  connection,
  concurrency: 10,
});

// Worker event handlers
const workers = [fetchWorker, parseWorker];

workers.forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed in queue ${worker.name}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed in queue ${worker.name}:`, err);
  });

  worker.on('error', (err) => {
    console.error(`Worker ${worker.name} error:`, err);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
});

console.log('Workers started successfully');
