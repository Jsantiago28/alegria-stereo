// Ficha de "aplicación" de la página: nombre, colores e ícono con el logo
// que salen cuando alguien la guarda en la pantalla de inicio del celular.
import type { APIRoute } from "astro";
import { getImage } from "astro:assets";
import logo from "../assets/logo.png";
import { emisora } from "../data/emisora";

export const GET: APIRoute = async () => {
  const icono192 = await getImage({ src: logo, width: 192, height: 192, format: "png" });
  const icono512 = await getImage({ src: logo, width: 512, height: 512, format: "png" });

  const ficha = {
    name: emisora.nombre,
    short_name: "Alegría Stereo",
    description: `${emisora.lema}. Radio en vivo desde Santo Domingo.`,
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050a24",
    theme_color: "#050a24",
    icons: [
      { src: icono192.src, sizes: "192x192", type: "image/png" },
      { src: icono512.src, sizes: "512x512", type: "image/png" },
    ],
  };

  return new Response(JSON.stringify(ficha), {
    headers: { "Content-Type": "application/manifest+json" },
  });
};
