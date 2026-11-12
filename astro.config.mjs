// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Dirección pública del sitio. Cambiarla cuando tengamos el dominio real.
  site: "https://alegriastereomusical.pages.dev",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "always" },
  vite: { plugins: [tailwindcss()] },
});
