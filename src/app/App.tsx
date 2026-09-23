import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { AppRoutes } from '@/app/routes'
import { OfflineBanner } from '@/components/OfflineBanner'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineBanner />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
