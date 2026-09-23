import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTodos } from '@/app/providers/TodosProvider'
import { NotificationService } from '@/services/NotificationService'
import { checkDueReminders, startReminderWatcher } from '@/services/ReminderService'
import { subscribeToForegroundMessages } from '@/firebase/messaging'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { todos } = useTodos()
  const navigate = useNavigate()
  const todosRef = useRef(todos)
  todosRef.current = todos

  useEffect(() => {
    if (!user) return

    const service = new NotificationService(user.uid)

    void (async () => {
      if (Notification.permission === 'granted') {
        await service.registerFcmToken().catch(console.error)
      }
    })()

    const stopWatcher = startReminderWatcher(() => todosRef.current)

    let unsubForeground: (() => void) | undefined
    void subscribeToForegroundMessages((payload) => {
      const taskId = payload.data?.taskId
      const title = payload.notification?.title ?? 'Nudge'
      const body = payload.notification?.body ?? ''

      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.svg',
          data: payload.data,
        })
        notification.onclick = () => {
          if (taskId) navigate(`/?task=${taskId}`)
          notification.close()
        }
      }
    }).then((unsub) => {
      unsubForeground = unsub ?? undefined
    })

    return () => {
      stopWatcher()
      unsubForeground?.()
    }
  }, [user, navigate])

  // Check immediately when todos change (e.g. reminder time passes while viewing)
  useEffect(() => {
    if (Notification.permission === 'granted') {
      checkDueReminders(todos)
    }
  }, [todos])

  return children
}
