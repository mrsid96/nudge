import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirestoreDb } from '@/firebase/firestore'
import { devicesCollectionPath } from '@/firebase/firestore'
import { requestFcmToken, isMessagingSupported } from '@/firebase/messaging'

function getDeviceId(): string {
  const key = 'nudge_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export class NotificationService {
  constructor(private readonly userId: string) {}

  async isSupported(): Promise<boolean> {
    return (
      'Notification' in window &&
      (await isMessagingSupported()) &&
      Notification.permission !== 'denied'
    )
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /** Register FCM for push when the tab is closed. Optional — local reminders work without it. */
  async registerFcmToken(): Promise<boolean> {
    const token = await requestFcmToken()
    if (!token) return false

    const deviceId = getDeviceId()
    const deviceRef = doc(getFirestoreDb(), devicesCollectionPath(this.userId), deviceId)

    await setDoc(
      deviceRef,
      {
        id: deviceId,
        userId: this.userId,
        fcmToken: token,
        platform: 'web',
        browser: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        enabled: true,
      },
      { merge: true },
    )

    return true
  }

  async registerDevice(): Promise<boolean> {
    const granted = await this.requestPermission()
    if (!granted) return false

    try {
      await this.registerFcmToken()
    } catch (error) {
      console.warn('FCM registration failed; in-app reminders still work:', error)
    }

    return true
  }
}
