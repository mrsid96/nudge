import { useEffect } from 'react'

interface ShortcutHandlers {
  onNew?: () => void
  onSearch?: () => void
  onComplete?: () => void
  onSnooze?: () => void
  onEscape?: () => void
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused() && e.key !== 'Escape') return

      switch (e.key) {
        case 'n':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            handlers.onNew?.()
          }
          break
        case '/':
          e.preventDefault()
          handlers.onSearch?.()
          break
        case 'c':
          handlers.onComplete?.()
          break
        case 's':
          handlers.onSnooze?.()
          break
        case 'Escape':
          handlers.onEscape?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
