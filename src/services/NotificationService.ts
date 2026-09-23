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
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async registerDevice(): Promise<boolean> {
    const granted = await this.requestPermission()
    if (!granted) return false

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
}
