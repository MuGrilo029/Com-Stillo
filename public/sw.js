// Service Worker para Web Push Notifications
// Instalação e ativação do SW

const CACHE_NAME = 'gestao-pro-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.warn('⚠️ Alguns assets não puderam ser cacheados');
      });
    })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Receber Push Notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push notification recebida:', event);

  let notificationData = {
    title: '💰 Nova Venda!',
    body: 'Uma nova venda foi registrada.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'sale-notification',
    requireInteraction: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data.metadata || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/favicon.ico'
        }
      ]
    })
  );
});

// Clicar na Notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada:', event.action);

  event.notification.close();

  const saleId = event.notification.data?.saleId;
  const clientUrl = event.notification.data?.url || '/';

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Procura por uma janela já aberta
      for (const client of clientList) {
        if (client.url === clientUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // Se não houver, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(clientUrl);
      }
    })
  );
});

// Estratégia de Cache: Network First, com fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Para APIs, usar Network First
  if (event.request.url.includes('/rest/v1/') || event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Não cachear respostas de erro
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Para assets estáticos, usar Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
      );
    })
  );
});

// Sincronização em Background (quando volta online)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);

  if (event.tag === 'sync-sales') {
    event.waitUntil(
      fetch('/api/sync-sales')
        .then((response) => {
          if (response.ok) {
            console.log('✅ Vendas sincronizadas');
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao sincronizar vendas:', error);
        })
    );
  }
});
