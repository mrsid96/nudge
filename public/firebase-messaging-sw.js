/* eslint-disable no-undef */
importScripts('/__firebase_config.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js')

if (self.__FIREBASE_CONFIG__) {
  firebase.initializeApp(self.__FIREBASE_CONFIG__)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Nudge'
    const options = {
      body: payload.notification?.body,
      icon: '/favicon.svg',
      data: payload.data ?? {},
    }
    self.registration.showNotification(title, options)
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const taskId = event.notification.data?.taskId
  const url = taskId ? `/?task=${taskId}` : '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    }),
  )
})
