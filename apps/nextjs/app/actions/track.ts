'use server';

import { track } from '@dub/analytics/server';

// Track lead
export async function trackLead() {
  console.log('Lead tracked');
}

// Track sale
export async function trackSale() {
  console.log('Sale tracked');
}
