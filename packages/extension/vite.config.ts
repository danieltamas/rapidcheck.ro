/**
 * Vite build for @rapidcheck/extension.
 *
 * Three output bundles, all written to `<repo>/dist/extension/` so the
 * directory is loadable directly via `chrome://extensions → Load unpacked`:
 *
 *   - background.js  ESM service worker (manifest declares `"type": "module"`)
 *   - content.js     IIFE — content scripts cannot use ES modules at top level
 *   - popup.js       ESM consumed by popup.html
 *
 * Static assets (manifest.json, popup.html, popup.css, icons/) are copied
 * via a tiny plugin so the built directory is self-contained.
 *
 * v0.1 SCOPE: Chrome desktop only. No `web-ext`, no `addons-linter`, no
 * Firefox-specific manifest keys, no `.xpi` packaging. Cross-browser parity
 * is a v0.2 deliverable.
 */

import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const outDir = resolve(root, 'dist/extension');
const srcDir = resolve(here, 'src');

/**
 * Copy static extension assets into the build output.
 * Runs at the close of every build target so partial outputs are always
 * coherent enough to load unpacked, even mid-watch.
 */
/**
 * Copy a file only if the destination is missing or differs by size. Some
 * sandboxes restrict overwriting existing files, and re-copying byte-identical
 * outputs is wasted work anyway.
 */
function copyIfChanged(src: string, dest: string): void {
  if (existsSync(dest)) {
    try {
      const sStat = statSync(src);
      const dStat = statSync(dest);
      if (sStat.size === dStat.size) return; // assume same content
    } catch {
      // fall through to writeFile
    }
  }
  try {
    copyFileSync(src, dest);
  } catch {
    // copyFileSync may EPERM under sandboxes that restrict overwrites; fall
    // back to a read+write which the sandbox allows for files we own.
    writeFileSync(dest, readFileSync(src));
  }
}

function copyExtensionAssets(): Plugin {
  return {
    name: 'rapidcheck:copy-extension-assets',
    apply: 'build',
    closeBundle() {
      mkdirSync(outDir, { recursive: true });

      // manifest
      copyIfChanged(resolve(srcDir, 'manifest.json'), resolve(outDir, 'manifest.json'));

      // popup html + css
      copyIfChanged(resolve(srcDir, 'popup/popup.html'), resolve(outDir, 'popup.html'));
      copyIfChanged(resolve(srcDir, 'popup/popup.css'), resolve(outDir, 'popup.css'));

      // proof page html + css
      copyIfChanged(resolve(srcDir, 'proof/proof.html'), resolve(outDir, 'proof.html'));
      copyIfChanged(resolve(srcDir, 'proof/proof.css'), resolve(outDir, 'proof.css'));

      // icons (the gen-icons script lands later as a follow-up; copy what
      // exists so the manifest reference paths resolve once icons land)
      const iconsSrc = resolve(here, 'icons');
      if (existsSync(iconsSrc)) {
        const iconsOut = resolve(outDir, 'icons');
        mkdirSync(iconsOut, { recursive: true });
        for (const f of readdirSync(iconsSrc)) {
          const s = resolve(iconsSrc, f);
          if (statSync(s).isFile()) copyIfChanged(s, resolve(iconsOut, f));
        }
      }

      // rule packs — exposed via `web_accessible_resources` so the SW can
      // load them through `chrome.runtime.getURL("rule-packs/<domain>.json")`.
      // Copying here keeps the dist directory self-contained: load unpacked,
      // navigate to a verified domain, content script renders.
      const packsSrc = resolve(root, 'rule-packs');
      if (existsSync(packsSrc)) {
        const packsOut = resolve(outDir, 'rule-packs');
        mkdirSync(packsOut, { recursive: true });
        for (const f of readdirSync(packsSrc)) {
          if (!f.endsWith('.json')) continue;
          const s = resolve(packsSrc, f);
          if (statSync(s).isFile()) copyIfChanged(s, resolve(packsOut, f));
        }
      }

      // Bundled assets (logos, etc) — referenced from packs via
      // `chrome.runtime.getURL("assets/<file>")` and exposed via
      // `web_accessible_resources` in manifest.json.
      const assetsSrc = resolve(srcDir, 'assets');
      if (existsSync(assetsSrc)) {
        const assetsOut = resolve(outDir, 'assets');
        mkdirSync(assetsOut, { recursive: true });
        for (const f of readdirSync(assetsSrc)) {
          const s = resolve(assetsSrc, f);
          if (statSync(s).isFile()) copyIfChanged(s, resolve(assetsOut, f));
        }
      }
    },
  };
}

const baseDefines = {
  __DEV__: JSON.stringify(process.env['NODE_ENV'] !== 'production'),
};

const target = process.env['RAPIDCHECK_TARGET'] ?? 'all';

/**
 * Vite supports a single `build.lib.entry` per invocation, so we expose the
 * five bundles as a single config that selects which one to build via the
 * `RAPIDCHECK_TARGET` env var. The `bun run build` script invokes Vite five
 * times in sequence (one per target).
 *
 * For the scaffold task this is intentionally minimal — Track 4 may swap in
 * a fancier orchestrator if the build pipeline grows.
 */
export default defineConfig(() => {
  const common = {
    root,
    define: baseDefines,
    plugins: [copyExtensionAssets()],
  };

  if (target === 'background') {
    return {
      ...common,
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        target: 'esnext',
        lib: {
          entry: resolve(srcDir, 'background/index.ts'),
          formats: ['es'],
          fileName: () => 'background.js',
        },
        rollupOptions: {
          output: { inlineDynamicImports: true },
        },
      },
    };
  }

  if (target === 'content') {
    return {
      ...common,
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        target: 'esnext',
        lib: {
          entry: resolve(srcDir, 'content/index.ts'),
          formats: ['iife'],
          name: 'RapidcheckContent',
          fileName: () => 'content.js',
        },
        rollupOptions: {
          output: { inlineDynamicImports: true, extend: true },
        },
      },
    };
  }

  if (target === 'popup') {
    return {
      ...common,
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        target: 'esnext',
        lib: {
          entry: resolve(srcDir, 'popup/index.tsx'),
          formats: ['es'],
          fileName: () => 'popup.js',
        },
        rollupOptions: {
          output: { inlineDynamicImports: true },
        },
      },
    };
  }

  if (target === 'proof') {
    return {
      ...common,
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        target: 'esnext',
        lib: {
          entry: resolve(srcDir, 'proof/proof.tsx'),
          formats: ['es'],
          fileName: () => 'proof.js',
        },
        rollupOptions: {
          output: { inlineDynamicImports: true },
        },
      },
    };
  }

  if (target === 'serp') {
    return {
      ...common,
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        target: 'esnext',
        lib: {
          entry: resolve(srcDir, 'serp/index.ts'),
          formats: ['iife'],
          name: 'RapidcheckSerp',
          fileName: () => 'serp.js',
        },
        rollupOptions: {
          output: { inlineDynamicImports: true, extend: true },
        },
      },
    };
  }

  // Default ("all") falls back to popup so a bare `vite build` without env
  // gives something inspectable; the `bun run build` orchestrator below
  // overrides this with explicit targets.
  return {
    ...common,
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: false,
      target: 'esnext',
      lib: {
        entry: resolve(srcDir, 'popup/index.tsx'),
        formats: ['es'],
        fileName: () => 'popup.js',
      },
      rollupOptions: {
        output: { inlineDynamicImports: true },
      },
    },
  };
});
