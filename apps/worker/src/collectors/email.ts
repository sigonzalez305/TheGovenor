import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { config } from '../config';

export async function fetchEmail(source: any): Promise<any[]> {
  if (!config.IMAP_HOST || !config.IMAP_USER || !config.IMAP_PASSWORD) {
    console.log('Email IMAP credentials not configured');
    return [];
  }

  const items: any[] = [];

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.IMAP_USER!,
      password: config.IMAP_PASSWORD!,
      host: config.IMAP_HOST!,
      port: parseInt(config.IMAP_PORT || '993'),
      tls: true,
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for recent messages (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        imap.search(['UNSEEN', ['SINCE', yesterday]], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (results.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          const fetch = imap.fetch(results, { bodies: '' });

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error('Email parse error:', err);
                  return;
                }

                items.push({
                  externalId: parsed.messageId,
                  publishedAt: parsed.date?.toISOString(),
                  raw: {
                    from: parsed.from?.text,
                    subject: parsed.subject,
                    text: parsed.text,
                    html: parsed.html,
                    date: parsed.date,
                  },
                });
              });
            });
          });

          fetch.once('end', () => {
            imap.end();
            resolve(items);
          });

          fetch.once('error', (err) => {
            reject(err);
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}
