// Service Worker do petDiary — Web Push (VAPID)
// Caches simples não usados; foco em receber push e abrir a aba certa.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "petDiary", body: event.data.text() };
  }

  const title = payload.title || "petDiary";
  const options = {
    body: payload.body || "",
    icon: "/logo-192.png",
    badge: "/logo-192.png",
    data: payload.data || {},
    tag: payload.data?.id || "petdiary",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const screen = data.screen;

  let path = "/notifications";
  if (screen === "Subscription") path = "/conta";
  else if (screen === "PetDashboard" && data.petId) path = "/tutor";
  else if (screen === "Notifications") path = "/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(path).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(path);
        }
      })
  );
});
