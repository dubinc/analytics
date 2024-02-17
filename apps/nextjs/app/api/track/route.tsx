import { lead } from '@dub/analytics/server';

export async function GET(request: Request) {
  lead(request, 'apiKey', { property: 'value' });

  return Response.json({ message: 'Event tracked' });
}
