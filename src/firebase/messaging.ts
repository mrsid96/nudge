import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging'
import { getFirebaseApp, vapidKey } from './config'

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
    const token = await getToken(msg, { vapidKey })
    return token
  } catch (error) {
    console.error('Failed to get FCM token:', error)
    return null
  }
}

export async function subscribeToForegroundMessages(
  callback: (payload: unknown) => void,
): Promise<(() => void) | null> {
  const msg = await getFirebaseMessaging()
  if (!msg) return null
  return onMessage(msg, callback)
}
