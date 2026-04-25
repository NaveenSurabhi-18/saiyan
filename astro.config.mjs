// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://NaveenSurabhi-18.github.io',
  base: '/saiyan',
  compressHTML: true,
  build: {
    assets: '_assets',
  },
});
