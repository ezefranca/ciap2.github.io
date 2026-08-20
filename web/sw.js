const CACHE_NAME = "ciap2-web-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=4",
  "./app.js?v=4",
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
  "./og.png",
  "./data/ciap2.json"
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
