// Ficha de "aplicación" del PANEL (aparte de la de la emisora):
// al instalarla, el dueño abre directo el panel desde la pantalla de inicio o el escritorio.
import type { APIRoute } from "astro";
import { getImage } from "astro:assets";
import logo from "../../assets/logo.png";
import { emisora } from "../../data/emisora";

export const GET: APIRoute = async () => {
  const icono192 = await getImage({ src: logo, width: 192, height: 192, format: "png" });
  const icono512 = await getImage({ src: logo, width: 512, height: 512, format: "png" });

  const ficha = {
    id: "/admin/",
    name: `Panel · ${emisora.nombre}`,
    short_name: "Panel Alegría",
    description: "Panel del administrador de la emisora.",
    lang: "es",
    start_url: "/admin/",
    scope: "/admin/",
    display: "standalone",
    background_color: "#0a1440",
    theme_color: "#0a1440",
    icons: [
      { src: icono192.src, sizes: "192x192", type: "image/png" },
      { src: icono512.src, sizes: "512x512", type: "image/png" },
    ],
  };

  return new Response(JSON.stringify(ficha), {
    headers: { "Content-Type": "application/manifest+json" },
  });
};
