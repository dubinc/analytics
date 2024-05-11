// import { track } from '@dub/analytics/server';
import { cookies } from 'next/headers';

const tackingEndpoint = 'http://localhost:8888/api/track';
const apiKey = 'iGjIsxS2OsMuQFaRdH5jZKNn';
const customerId = 'iGyAA2';

export async function POST() {
  // TODO:
  // Use SDK method to track a lead

  const cookieStore = cookies();
  const cookie = cookieStore.get('dclid');
  const clickId = cookie?.value || null;

  if (!clickId) {
    return Response.json({ message: 'No clickId found' }, { status: 400 });
  }

  await fetch(`${tackingEndpoint}/lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      clickId,
      customerId,
      eventName: 'Created an account',
    }),
  });

  return Response.json({ message: 'OK' });
}
