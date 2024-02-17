import { track } from '@dub/analytics/server';

export async function GET(request: Request) {
  track(request, 'apiKey', 'eventName', { property: 'value' });

  return Response.json({ message: 'Event tracked' });
}
