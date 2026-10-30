import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    env: {
      DUB_FINGERPRINT_PUBLIC_KEY: 'test_public_key',
    },
  },
});
