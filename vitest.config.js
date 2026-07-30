import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^.*\/scripts\/aem\.js$/,
        replacement: path.resolve(rootDir, 'test/mocks/aem.js'),
      },
      {
        find: /^.*\/scripts\/scripts\.js$/,
        replacement: path.resolve(rootDir, 'test/mocks/scripts.js'),
      },
    ],
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.js'],
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          disableJavaScriptFileLoading: true,
        },
      },
    },
  },
});
