const CACHE_NAME = 'Field Spotter';
const CACHE_URLS = [
  'index.html',
  './',
  'css/base.css',
  'css/layout.css',
  'css/style.css',
  'css/mobile.css',
  'js/globals.js',
  'js/adif-funcs.js',
  'js/display-funcs.js',
  'js/utility-funcs.js',
  'js/map-setup-funcs.js',
  'js/ui-funcs.js',
  'js/local-storage-funcs.js',
  'js/pwa-funcs.js',
  'js/startup.js',
  'img/favicon.png',
  'img/favicon-32.png',
  'img/favicon-192.png'
];

self.addEventListener('fetch', (event) => {
  // Is this an asset we can cache?
  const url = new URL(event.request.url);
  const isCacheableRequest = CACHE_URLS.includes(url.pathname);

  if (isCacheableRequest) {
    // Open the cache
    event.respondWith(caches.open(CACHE_NAME).then((cache) => {
      // Go to the network first, cacheing the response
      return fetch(event.request.url).then((fetchedResponse) => {
        cache.put(event.request, fetchedResponse.clone());

        return fetchedResponse;
      }).catch(() => {
        // If the network is unavailable, get from cache.
        return cache.match(event.request.url);
      });
    }));
  } else {
    // Not a cacheable request, must be a call to the API, so no cache involved just go to the network
  }
});
