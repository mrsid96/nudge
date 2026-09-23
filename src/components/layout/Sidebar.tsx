import {
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  MessageCircle,
  Hourglass,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLabels } from '@/hooks/useLabels'
import { LabelChip } from '@/components/LabelChip/LabelChip'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/', label: 'Inbox', icon: Inbox, end: true },
  { to: '/today', label: 'Today', icon: Calendar },
  { to: '/upcoming', label: 'Upcoming', icon: Clock },
  { to: '/follow-ups', label: 'Follow-ups', icon: MessageCircle },
  { to: '/waiting', label: 'Waiting', icon: Hourglass },
  { to: '/completed', label: 'Completed', icon: CheckCircle2 },
]

export function Sidebar() {
  const [labelsEnabled, setLabelsEnabled] = useState(false)

  // Defer label listener until browser is idle — todos load first
  useEffect(() => {
    const enable = () => setLabelsEnabled(true)
    const idle = globalThis.requestIdleCallback?.(enable)
    if (idle !== undefined) {
      return () => globalThis.cancelIdleCallback?.(idle)
    }
    const timer = setTimeout(enable, 150)
    return () => clearTimeout(timer)
  }, [])

  const { labels } = useLabels({ enabled: labelsEnabled })

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-elevated text-text font-medium'
                  : 'text-text-muted hover:bg-elevated/50 hover:text-text',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {labels.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
            Labels
          </p>
          <div className="flex flex-wrap gap-1.5 px-2">
            {labels.map((label) => (
              <NavLink key={label.id} to={`/search?q=%23${label.name}`}>
                <LabelChip name={`#${label.name}`} color={label.color} />
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
