import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { AppRoutes } from '@/app/routes'
import { OfflineBanner } from '@/components/OfflineBanner'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <OfflineBanner />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
