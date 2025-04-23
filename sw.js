// sw.js - Service Worker

const CACHE_NAME = 'budget-pwa-cache-v1'; // Change version to force update
const urlsToCache = [
  '/', // Cache the root URL (index.html)
  '/index.html', // Explicitly cache index.html
  '/style.css',
  '/script.js',
  '/images/icon-192x192.png', // Cache icons too
  '/images/icon-512x512.png'
];

// --- Installation Event ---
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // Perform install steps: tell the browser to wait until caching is done
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete, app shell cached.');
        // Immediately activate the new service worker once installed
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// --- Activation Event ---
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation complete, claimed clients.');
        return self.clients.claim();
    })
  );
});

// --- Fetch Event (Intercepting Network Requests) ---
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    caches.match(event.request) 
      .then(response => {
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch(error => {
         console.error('Service Worker: Fetch failed', error);
      })
  );
});