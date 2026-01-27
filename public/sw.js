// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'default',
      data: {
        url: data.url || '/',
        ...data.data,
      },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'RidesWith', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
