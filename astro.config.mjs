import { defineConfig } from 'astro/config';

// Projectsite op GitHub Pages: https://bbssolutions-hosting-freemiumapps.github.io/videobible/
export default defineConfig({
  site: 'https://bbssolutions-hosting-freemiumapps.github.io',
  base: '/videobible',
  trailingSlash: 'always',
  prefetch: false,
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  outDir: 'dist',
});
