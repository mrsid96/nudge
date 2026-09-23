let registration: ServiceWorkerRegistration | null = null

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  if (registration) return registration

  try {
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    })
    await navigator.serviceWorker.ready
    return registration
  } catch (error) {
    console.error('Failed to register messaging service worker:', error)
    return null
  }
}
