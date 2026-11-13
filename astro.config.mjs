// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Dirección pública del sitio (dominio propio, comprado en Cloudflare el 12/11/2026).
  site: "https://alegriastereomusical.com",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "always" },
  // Mapa del sitio para Google (sale en /sitemap-index.xml). El panel /admin no va.
  integrations: [sitemap({ filter: (pagina) => !/\/admin\/?$/.test(new URL(pagina).pathname) })],
  vite: { plugins: [tailwindcss()] },
});
