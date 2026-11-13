// Necesario para que los navegadores ofrezcan "Instalar" la página como aplicación.
// No guarda nada en el teléfono: todo sigue yendo directo a internet, así los cambios se ven al instante.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
