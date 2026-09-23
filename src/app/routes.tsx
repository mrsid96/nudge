import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/app/providers/AuthProvider'
import { Skeleton } from '@/components/ui/Skeleton'

const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const TodoViewPage = lazy(() =>
  import('@/features/todos/TodoViewPage').then((m) => ({ default: m.TodoViewPage })),
)
const SearchPage = lazy(() =>
  import('@/features/todos/TodoViewPage').then((m) => ({ default: m.SearchPage })),
)
const CompletedPage = lazy(() =>
  import('@/features/completed/CompletedPage').then((m) => ({ default: m.CompletedPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

function PageLoader() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-6 md:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth()

  if (!isConfigured) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="today" element={<TodoViewPage title="Today" filter="today" />} />
          <Route path="upcoming" element={<TodoViewPage title="Upcoming" filter="upcoming" />} />
          <Route path="follow-ups" element={<TodoViewPage title="Follow-ups" filter="follow-ups" />} />
          <Route path="waiting" element={<TodoViewPage title="Waiting" filter="waiting" />} />
          <Route path="completed" element={<CompletedPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="task/:id" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
