import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import netlify from '@astrojs/netlify';
import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env
dotenv.config();

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  devToolbar: {
    enabled: false  // Deshabilitar toolbar de dev para evitar errores
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react/jsx-runtime': 'preact/jsx-runtime'
      }
    },
    define: {
      'process.env.USE_GOOGLE_SHEETS': JSON.stringify(process.env.USE_GOOGLE_SHEETS),
      'process.env.GOOGLE_SHEET_ID': JSON.stringify(process.env.GOOGLE_SHEET_ID),
      'process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH': JSON.stringify(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH),
    }
  },

  integrations: [preact()]
});