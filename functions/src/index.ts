import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onSchedule } from 'firebase-functions/v2/scheduler'

initializeApp()

const db = getFirestore()
const messaging = getMessaging()

export const processReminders = onSchedule('every 1 minutes', async () => {
  const now = Timestamp.now()

  const usersSnapshot = await db.collection('users').listDocuments()

  for (const userRef of usersSnapshot) {
    const [reminderSnapshot, dueSnapshot] = await Promise.all([
      userRef
        .collection('todos')
        .where('status', 'in', ['active', 'snoozed'])
        .where('reminderAt', '<=', now)
        .get(),
      userRef
        .collection('todos')
        .where('status', 'in', ['active', 'snoozed'])
        .where('dueAt', '<=', now)
        .get(),
    ])

    const todoDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>()
    for (const doc of reminderSnapshot.docs) todoDocs.set(doc.id, doc)
    for (const doc of dueSnapshot.docs) todoDocs.set(doc.id, doc)

    if (todoDocs.size === 0) continue

    const devicesSnapshot = await userRef
      .collection('devices')
      .where('enabled', '==', true)
      .get()

    const tokens = devicesSnapshot.docs
      .map((doc) => doc.data().fcmToken as string)
      .filter(Boolean)

    if (tokens.length === 0) continue

    for (const todoDoc of todoDocs.values()) {
      const todo = todoDoc.data()

      const snoozedUntil = todo.snoozedUntil as Timestamp | undefined
      if (snoozedUntil && snoozedUntil.toMillis() > now.toMillis()) continue

      // Skip if already notified for this reminder/due time
      const reminderNotifiedAt = todo.reminderNotifiedAt as Timestamp | undefined
      const reminderAt = todo.reminderAt as Timestamp | undefined
      const dueAt = todo.dueAt as Timestamp | undefined
      const fireAt = reminderAt ?? dueAt
      if (!fireAt || fireAt.toMillis() > now.toMillis()) continue
      if (reminderNotifiedAt && reminderNotifiedAt.toMillis() >= fireAt.toMillis()) {
        continue
      }

      const title = todo.title as string
      const type = todo.type as string

      let notificationTitle = 'Task reminder'
      if (type === 'follow_up') notificationTitle = 'Follow-up reminder'
      if (type === 'waiting') notificationTitle = 'Check on waiting item'

      try {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: notificationTitle,
            body: title,
          },
          data: {
            taskId: todoDoc.id,
            url: `/?task=${todoDoc.id}`,
          },
        })

        const updates: Record<string, unknown> = {
          reminderNotifiedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        if (todo.status === 'snoozed') {
          updates.status = 'active'
        }

        await todoDoc.ref.update(updates)
      } catch (error) {
        console.error(`Failed to send reminder for todo ${todoDoc.id}:`, error)
      }
    }
  }
})
