import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve @notify-ui/shared from source so we don't need a pre-built dist
    alias: {
      '@notify-ui/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  // Prevent Vite from pre-bundling local source imports
  optimizeDeps: {
    exclude: ['@notify-ui/shared'],
  },
});
