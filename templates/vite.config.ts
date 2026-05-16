import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_PORTAL_BASE ?? '/portals/templates/',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5176,
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
});
