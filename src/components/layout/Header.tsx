import { Bell, LogOut, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useDueReminderCount } from '@/app/providers/NotificationProvider'
import { SearchBar } from '@/components/SearchBar/SearchBar'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export function Header({ searchQuery, onSearchChange, searchInputRef }: HeaderProps) {
  const { user } = useAuth()
  const dueCount = useDueReminderCount()

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3 md:px-6">
      <Link to="/" className="shrink-0 text-lg font-semibold tracking-tight">
        Nudge
      </Link>

      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        className="hidden flex-1 max-w-md md:block"
        inputRef={searchInputRef}
      />

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/settings"
          className="rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <Link
          to="/settings#notifications"
          className="relative rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {dueCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {dueCount > 9 ? '9+' : dueCount}
            </span>
          )}
        </Link>
        {user && (
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <button
              onClick={() => import('@/firebase/auth').then((m) => m.signOutUser())}
              className="rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
