import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging'
import { getFirebaseApp, vapidKey } from './config'
import { registerMessagingServiceWorker } from './registerMessagingSw'

let messaging: Messaging | undefined

export async function isMessagingSupported(): Promise<boolean> {
  return isSupported()
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!(await isMessagingSupported())) return null
  if (!messaging) {
    messaging = getMessaging(getFirebaseApp())
  }
  return messaging
}

export async function requestFcmToken(): Promise<string | null> {
  const msg = await getFirebaseMessaging()
  if (!msg || !vapidKey) return null

  try {
    const registration = await registerMessagingServiceWorker()
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    })
    return token
  } catch (error) {
    console.error('Failed to get FCM token:', error)
    return null
  }
}

export async function subscribeToForegroundMessages(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void,
): Promise<(() => void) | null> {
  const msg = await getFirebaseMessaging()
  if (!msg) return null
  return onMessage(msg, callback)
}
