import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://georgematei.com',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'never' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
