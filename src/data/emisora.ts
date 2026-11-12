// Toda la información de la emisora vive aquí.
// Para cambiar un teléfono, un horario o un programa, se edita este archivo y nada más.

export const emisora = {
  nombre: "Alegría Stereo Musical",
  lema: "Tu emisora de siempre",
  ciudad: "Santo Domingo, República Dominicana",

  // Señal en vivo de Zeno.fm (la que suena en el reproductor de la página).
  stream: "https://stream.zeno.fm/rv74vcczasxuv",
  // De aquí sale el título de la canción que está sonando ("Sonando ahora").
  sonandoAhora: "https://api.zeno.fm/mounts/metadata/subscribe/rv74vcczasxuv",
  paginaZeno: "https://zeno.fm/radio/alegria-stereo-musical/",

  telefono: "(809) 420-1033",
  // Número para WhatsApp y llamadas: 1 + código de área + número, sin espacios.
  whatsapp: "18094201033",
  correo: "alegriastereomusical@gmail.com",
  instagram: "https://www.instagram.com/alalegriastereomusical/",
  instagramUsuario: "@alalegriastereomusical",

  generos: ["Romántica", "Tropical", "Baladas", "Clásicos", "Éxitos actuales"],
};

// Emisora aliada que presenta "Talentos sin Fronteras" (sale en el volante).
export const aliada = {
  nombre: "Radio Music Digital 105.7",
  lema: "La señal que te conecta con el talento de todas partes",
  web: "https://www.radiomusicdigital1057.com",
  zeno: "https://zeno.fm/radio/music-digital-1057/",
  instagram: "https://www.instagram.com/radiomusicdigital105.7",
};

export type Programa = {
  nombre: string;
  locutor: string;
  apodo: string;
  // 0 = domingo, 1 = lunes … 5 = viernes, 6 = sábado
  dias: number[];
  // Hora de inicio en hora de República Dominicana (formato 24 h).
  hora: number;
  minuto: number;
  duracionMin: number;
  lema: string;
  descripcion: string;
  etiquetas: string[];
  // Volante del programa (archivo dentro de src/assets). Opcional.
  volante?: "talentos";
  presenta?: string;
};

export const programas: Programa[] = [
  {
    nombre: "Talentos sin Fronteras",
    locutor: "Robinson Peña",
    apodo: "El Maestro del Amor",
    dias: [1],
    hora: 20,
    minuto: 0,
    duracionMin: 120, // POR CONFIRMAR con el cliente
    lema: "¡El escenario donde el talento no tiene fronteras!",
    descripcion:
      "Un espacio para apoyar y proyectar nuevos talentos de la música, la poesía, la composición y más.",
    etiquetas: ["Cantantes independientes", "Nuevas bandas", "Compositores y poetas", "Escritores y artistas", "Entrevistas"],
    volante: "talentos",
    presenta: "Radio Music Digital 105.7",
  },
  {
    nombre: "El Viernes Alegre",
    locutor: "Robinson Peña",
    apodo: "El Maestro del Amor",
    dias: [5],
    hora: 20,
    minuto: 0,
    duracionMin: 120, // POR CONFIRMAR con el cliente
    lema: "Para cerrar la semana con el pie derecho.",
    descripcion:
      "Merengue, música bailable y mucha interacción con los oyentes para arrancar el fin de semana con alegría.",
    etiquetas: ["Merengue", "Alegría", "Música", "Interacción"],
  },
];

// República Dominicana no cambia la hora en verano: siempre es UTC−4.
export const DIFERENCIA_RD = -4;

// Otros países donde nos escuchan y su diferencia con RD (en horas).
export const otrosPaises = [
  { pais: "México", codigo: "MÉX", diferencia: -2 },
  { pais: "Perú", codigo: "PERÚ", diferencia: -1 },
];

export const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function hora12(hora: number, minuto = 0) {
  const h = ((hora % 24) + 24) % 24;
  const sufijo = h < 12 ? "a. m." : "p. m.";
  return `${h % 12 || 12}:${String(minuto).padStart(2, "0")} ${sufijo}`;
}

export function diasTexto(dias: number[]) {
  if (dias.length === 1) return `Todos los ${nombresDias[dias[0]].toLowerCase()}${dias[0] === 6 || dias[0] === 0 ? "s" : ""}`;
  return dias.map((d) => nombresDias[d]).join(", ");
}

export function enlaceWhatsApp(mensaje: string) {
  return `https://wa.me/${emisora.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
