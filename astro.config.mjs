import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [preact()]
});