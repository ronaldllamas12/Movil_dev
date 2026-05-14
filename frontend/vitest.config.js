import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.js'],
    globals: true,
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/api/axiosClient.js',
        'src/api/mappers/productMapper.js',
        'src/api/services/cartService.js',
        'src/api/services/productsService.js',
        'src/hooks/useAsyncAction.js',
        'src/hooks/useAuthValidation.js',
        'src/utils/formatters.js',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        branches: 85,
        functions: 90,
      },
    },
  },
});
