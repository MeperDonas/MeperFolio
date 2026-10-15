import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Vitest stubs CSS imports by default, so a `?raw` import of the generated
    // palette file came back empty and the cascade contract test asserted
    // against "". The theme contract is checked against real source text.
    css: true,
  },
});
