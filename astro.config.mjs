// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Dirección pública del sitio (dominio propio, comprado en Cloudflare el 12/11/2026).
  site: "https://alegriastereomusical.com",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "always" },
  vite: { plugins: [tailwindcss()] },
});
