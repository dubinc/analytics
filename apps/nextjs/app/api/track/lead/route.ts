import { cookies } from 'next/headers';

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

  await fetch(`${process.env.DUB_API_URL}/track/lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DUB_API_KEY}`,
    },
    body: JSON.stringify({
      clickId,
      customerId,
      eventName: 'Created an account',
    }),
  });

  return Response.json({ message: 'OK' });
}
