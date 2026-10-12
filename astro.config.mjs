// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// Le site est statique, sauf les routes /api/* (Notion, aperçu de liens)
// qui s'exécutent sur les serveurs de Vercel.
export default defineConfig({
  integrations: [react()],
  adapter: vercel(),
  devToolbar: { enabled: false },
});
