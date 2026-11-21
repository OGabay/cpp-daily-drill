import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Builds src/background.ts into dist/background.js as a single ES module with every
// dynamic import inlined (import() is disallowed in extension service workers).
// Runs after the popup build, so it must not empty dist/.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome116',
    modulePreload: false,
    minify: 'esbuild',
    lib: {
      entry: resolve(root, 'src/background.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
