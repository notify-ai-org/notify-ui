import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite library-mode build.
 *
 * Outputs:
 *   dist/index.js   — ESM bundle (tree-shakeable by microfrontends)
 *   dist/index.cjs  — CommonJS bundle (for Jest / SSR)
 *
 * React, react-dom, react-redux, and @reduxjs/toolkit are all listed as
 * externals so they are NOT bundled — each consuming app brings its own.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NotifyUIShared',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-redux': 'ReactRedux',
          '@reduxjs/toolkit': 'ReduxToolkit',
        },
      },
    },
    sourcemap: true,
  },
});
