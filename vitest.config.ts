import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Mirrors the `@` alias from vite.config.ts so the pure utilities can
// import our TypeScript interfaces (`@/types/color`, `@/data/seasons`)
// exactly as the application does.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
