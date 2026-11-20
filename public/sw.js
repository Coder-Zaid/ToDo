// Service Worker for Black ToDo Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'ToDo';

    const actions = [];
    if (data.taskId) {
      actions.push({
        action: 'complete-task',
        title: '✓ Mark as Done',
      });
    }

    const options = {
      body: data.body || '',
      icon: data.icon || '/notification-tick.png',
      badge: data.badge || '/badge-tick.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        taskId: data.taskId || null,
        convexSiteUrl: data.convexSiteUrl || null,
      },
      tag: data.tag || (data.taskId ? `task-${data.taskId}` : 'todo-reminder'),
      renotify: true,
      actions: actions,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('ToDo Reminder', {
        body: text,
        icon: '/notification-tick.png',
        badge: '/badge-tick.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle "Mark as Done" action button directly from notification
  if (event.action === 'complete-task') {
    const taskId = event.notification.data?.taskId;
    const siteUrl = event.notification.data?.convexSiteUrl;

    if (taskId) {
      event.waitUntil(
        (async () => {
          // 1. Try same-origin Next.js API route first (zero CORS)
          try {
            const res = await fetch('/api/tasks/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taskId }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              return self.registration.showNotification('Task Completed', {
                body: 'Marked as completed!',
                icon: '/notification-tick.png',
                badge: '/badge-tick.png',
                tag: `completed-${taskId}`,
              });
            }
          } catch (e) {
            console.warn('Same-origin complete failed, falling back to Convex:', e);
          }

          // 2. Direct Convex HTTP endpoints with CORS fallback
          const endpoints = [
            siteUrl,
            'https://jovial-impala-287.convex.site',
            'https://pastel-vulture-190.convex.site',
          ].filter(Boolean);

          for (const url of endpoints) {
            try {
              const res = await fetch(`${url}/api/tasks/complete`, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId }),
              });
              const data = await res.json().catch(() => ({}));
              if (res.ok && data.success) {
                break;
              }
            } catch (_) {}
          }

          return self.registration.showNotification('Task Completed', {
            body: 'Marked as completed!',
            icon: '/notification-tick.png',
            badge: '/badge-tick.png',
            tag: `completed-${taskId}`,
          });
        })()
      );
    }
    return;
  }

  // Regular click on the notification body: focus or open the app window
  const urlToOpen =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
