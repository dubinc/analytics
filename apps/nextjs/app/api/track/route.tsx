import { track } from '@dub/analytics/server';

export async function GET(request: Request) {
  track.lead(request, 'apiKey', { property: 'value' });

  return Response.json({ message: 'Event tracked' });
}

export async function POST(request: Request) {
  try {
    const response = await fetch('https://api.dub.co/analytics/track', {
      method: 'POST',
      headers: new Headers(request.headers),
      body: await request.json(),
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.set('Content-Type', 'application/json');
    return new Response(await response.json(), {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
