const CACHE_NAME = "ciap2-web-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=6",
  "./app.js?v=6",
  "./manifest.webmanifest",
  "./icons/appicon.png",
  "./icons/chapters/procedimentos.png",
  "./icons/chapters/geral.png",
  "./icons/chapters/sangue.png",
  "./icons/chapters/digestivo.png",
  "./icons/chapters/olho.png",
  "./icons/chapters/ouvido.png",
  "./icons/chapters/circulatorio.png",
  "./icons/chapters/musculo.png",
  "./icons/chapters/neurologico.png",
  "./icons/chapters/psicologico.png",
  "./icons/chapters/respiratorio.png",
  "./icons/chapters/pele.png",
  "./icons/chapters/endocrino.png",
  "./icons/chapters/urinario.png",
  "./icons/chapters/gravidez.png",
  "./icons/chapters/feminino.png",
  "./icons/chapters/masculino.png",
  "./icons/chapters/sociais.png",
  "./icons/classifications/procedimentos.png",
  "./icons/classifications/sintomas.png",
  "./icons/classifications/infeccoes.png",
  "./icons/classifications/neoplasias.png",
  "./icons/classifications/traumatismos.png",
  "./icons/classifications/anomalias.png",
  "./icons/classifications/outros.png",
  "./assets/catalog/98d22b3dec7a1b6e.bin",
  "./assets/catalog/5090514bd2243e4e.bin",
  "./assets/catalog/c0bc64a577cf2665.bin",
  "./assets/catalog/cffe3ea7fa35961d.bin",
  "./assets/catalog/5ae918125c880255.bin",
  "./assets/catalog/75f1f90c3dff18ce.bin",
  "./assets/catalog/15bfcf84e1a3d82c.bin",
  "./assets/catalog/fca9ff4ffe427b62.bin",
  "./assets/catalog/129dac477303a7dc.bin",
  "./og.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);
  const needsFreshResponse = event.request.mode === "navigate" ||
    requestURL.pathname.endsWith(".css") ||
    requestURL.pathname.endsWith(".js");

  if (needsFreshResponse) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && requestURL.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : cached);

      return cached || network;
    })
  );
});
