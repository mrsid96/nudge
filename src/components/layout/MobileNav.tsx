import { Calendar, Home, Plus, Search, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function MobileNav() {
  const navigate = useNavigate()

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/search', label: 'Search', icon: Search },
    { action: () => navigate('/?capture=1'), label: 'Add', icon: Plus, primary: true },
    { to: '/upcoming', label: 'Upcoming', icon: Calendar },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-surface px-2 py-2 md:hidden">
      {items.map((item) => {
        if (item.action) {
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
              aria-label={item.label}
            >
              <item.icon className="h-6 w-6" />
            </button>
          )
        }

        return (
          <NavLink
            key={item.to}
            to={item.to!}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs',
                isActive ? 'text-primary' : 'text-text-muted',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
