import { track } from '@dub/analytics/server';
import { serialize } from 'cookie';

export async function GET(request: Request) {
  const click_id = await track.click(request, 'apiKey', 'https://example.com');

  const headers = new Headers();
  if (!click_id) {
    const serializedCookie = serialize('click_id', click_id, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
    });

    const headers = new Headers();
    headers.append('Set-Cookie', serializedCookie.toString());
  }

  return Response.json(
    { message: 'Click tracked' },
    {
      status: 200,
      headers,
    },
  );
}