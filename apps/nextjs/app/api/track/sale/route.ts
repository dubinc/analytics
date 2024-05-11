// import { track } from '@dub/analytics/server';

const tackingEndpoint = 'http://localhost:8888/api/track';
const apiKey = 'iGjIsxS2OsMuQFaRdH5jZKNn';
const customerId = 'iGyAA2';

export async function POST() {
  // TODO:
  // Use SDK method to track a sale

  await fetch(`${tackingEndpoint}/sale`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      customerId,
      paymentProcessor: 'stripe',
      productId: 'super-product-123',
      amount: 2000,
      recurring: true,
      recurringInterval: 'month',
      recurringIntervalCount: 4,
      refunded: false,
    }),
  });

  return Response.json({ message: 'OK' });
}
