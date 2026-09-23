import { useRef, useState } from 'react'
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { TaskDetailPanel } from '@/components/TaskDetail/TaskDetailPanel'

export function AppLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTaskId = searchParams.get('task')

  useKeyboardShortcuts({
    onSearch: () => {
      searchInputRef.current?.focus()
      navigate('/search')
    },
    onNew: () => navigate('/?capture=1'),
    onEscape: () => {
      if (selectedTaskId) {
        searchParams.delete('task')
        setSearchParams(searchParams)
      }
    },
  })

  function handleSearchChange(query: string) {
    setSearchQuery(query)
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        {selectedTaskId && (
          <TaskDetailPanel
            taskId={selectedTaskId}
            onClose={() => {
              searchParams.delete('task')
              setSearchParams(searchParams)
            }}
          />
        )}
      </div>
      <MobileNav />
    </div>
  )
}
