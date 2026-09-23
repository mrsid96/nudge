import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useTodos } from '@/hooks/useTodos'
import { NotificationService } from '@/services/NotificationService'
import { startReminderWatcher } from '@/services/ReminderService'
import { subscribeToForegroundMessages } from '@/firebase/messaging'
import { getDueReminders } from '@/services/todoFilters'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { todos } = useTodos()
  const navigate = useNavigate()
  const todosRef = useRef(todos)
  todosRef.current = todos

  useEffect(() => {
    if (!user) return

    const service = new NotificationService(user.uid)

    if (service.getPermissionStatus() === 'granted') {
      service.registerDevice().catch(console.error)
    }

    const stopWatcher = startReminderWatcher(() => todosRef.current)

    let unsubForeground: (() => void) | undefined
    subscribeToForegroundMessages((payload) => {
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

  return children
}

export function useDueReminderCount(): number {
  const { todos } = useTodos()
  return getDueReminders(todos).length
}
