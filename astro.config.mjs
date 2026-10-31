import { defineConfig } from 'astro/config';

// Eigen domein via GitHub Pages (branch main, map /). DNS wordt hier niet gezet.
export default defineConfig({
  site: 'https://videobijbel.bbss.to',
  base: '/',
  trailingSlash: 'always',
  prefetch: false,
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  outDir: 'dist',
});
