import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Popup build (popup.html + React UI). The background service worker is built separately by
// vite.background.config.ts as ONE self-contained file, because extension service workers
// may not use dynamic import(). Static files in /public (manifest, icons) are copied into /dist.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome110',
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { popup: resolve(root, 'popup.html') },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as any);
