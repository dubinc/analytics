export function isBrowser() {
  return typeof window !== 'undefined';
}

export function isDubAnalyticsReady() {
  return typeof window !== 'undefined' && window.dubAnalytics;
}
