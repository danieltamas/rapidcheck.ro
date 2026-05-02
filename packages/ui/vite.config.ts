/**
 * Vite build for the @onegov/ui standalone test harness.
 *
 * Bundles `src/index.ts` into a single ES module the test-harness.html can
 * import directly via `<script type="module">`. Output lives at
 * `packages/ui/dist/harness/renderer.bundle.js` so the harness can `import
 * './dist/harness/renderer.bundle.js'` with no path gymnastics.
 *
 * This is NOT the extension's popup bundle (that's owned by
 * `packages/extension/vite.config.ts`). It's only used by the visual smoke
 * harness — `bun run build:harness`.
 */

import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  build: {
    outDir: resolve(here, 'dist/harness'),
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    lib: {
      entry: resolve(here, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'renderer.bundle.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
});
