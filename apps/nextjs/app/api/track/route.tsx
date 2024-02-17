import { track } from '@dub/analytics/server';

export async function GET(request: Request) {
  track.lead(request, 'apiKey', { property: 'value' });

  return Response.json({ message: 'Event tracked' });
}
