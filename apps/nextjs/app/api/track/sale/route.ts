// import { track } from '@dub/analytics/server';

const customerId = 'iGyAA2';

export async function POST() {
  // TODO:
  // Use SDK method to track a sale

  await fetch(`${process.env.DUB_API_URL}/track/sale`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DUB_API_KEY}`,
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
