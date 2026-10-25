import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for building the Chrome extension.
 * Compiles TypeScript entry points into extension/dist/ as IIFE bundles.
 * Static assets (manifest, HTML, icons, styles) remain in extension/ root.
 */
export default defineConfig({
  build: {
    outDir: 'extension/dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: false },
    },
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'extension/src/background.ts'),
        content: resolve(__dirname, 'extension/src/content.ts'),
        popup: resolve(__dirname, 'extension/src/popup.ts'),
        sidepanel: resolve(__dirname, 'extension/src/sidepanel.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: false,
      },
      // Bundle all dependencies (chess.js, etc.) - nothing external
      external: [],
    },
    target: 'chrome100',
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@services': resolve(__dirname, 'extension/src/services'),
      '@': resolve(__dirname, 'extension/src'),
    },
  },
});
