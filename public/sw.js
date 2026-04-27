self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Notificación de Kamello", body: "Tienes una nueva actualización" };

  const options = {
    body: data.body,
    icon: "/images/K-Editado.png",
    badge: "/images/K-Editado.png",
    vibrate: [200, 100, 200],
    data: data.data || { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const urlToOpen = event.notification.data.url || "/";
      
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
