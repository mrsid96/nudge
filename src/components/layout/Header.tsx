import { LogOut, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { clearSessionData } from '@/lib/session'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { SyncStatusIndicator } from '@/components/SyncStatus/SyncStatusIndicator'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export function Header({ searchQuery, onSearchChange, searchInputRef }: HeaderProps) {
  const { user } = useAuth()

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

      <div className="ml-auto flex items-center gap-3">
        <SyncStatusIndicator />
        <Link
          to="/settings"
          className="rounded-lg p-2 text-text-muted hover:bg-elevated hover:text-text"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
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
              onClick={async () => {
                const { signOutUser } = await import('@/firebase/auth')
                if (user) await clearSessionData(user.uid)
                await signOutUser()
              }}
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
