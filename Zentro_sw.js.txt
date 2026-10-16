/* Zentro service worker: notification display/click handling. */
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type !== 'ZENTRO_SHOW_NOTIFICATION') return;
  const title = data.title || 'Zentro activity';
  const options = {
    body: data.body || 'There is new activity on Zentro.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || ('zentro-' + Date.now()),
    data: { url: data.url || './' },
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url || './';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) { await client.focus(); if ('navigate' in client) await client.navigate(url); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Zentro activity', {
    body: data.body || 'There is new activity on Zentro.',
    icon: './icon-192.png', badge: './icon-192.png',
    tag: data.tag || ('zentro-push-' + Date.now()),
    data: { url: data.url || './' }, renotify: true
  }));
});
