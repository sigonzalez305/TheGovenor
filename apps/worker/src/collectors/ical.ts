import ICAL from 'ical.js';
import fetch from 'node-fetch';

export async function fetchICAL(source: any): Promise<any[]> {
  if (!source.url) {
    console.log('iCal source missing URL');
    return [];
  }

  const items: any[] = [];

  try {
    const response = await fetch(source.url);
    const icalData = await response.text();

    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);

      items.push({
        externalId: event.uid,
        publishedAt: event.startDate.toJSDate().toISOString(),
        raw: {
          uid: event.uid,
          summary: event.summary,
          description: event.description,
          location: event.location,
          startDate: event.startDate.toJSDate().toISOString(),
          endDate: event.endDate.toJSDate().toISOString(),
          recurrenceRule: vevent.getFirstPropertyValue('rrule')?.toString(),
        },
      });
    }
  } catch (error) {
    console.error('iCal fetch error:', error);
    throw error;
  }

  return items;
}
