import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

interface QuickCaptureProps {
  onSubmit: (text: string) => Promise<void>
  className?: string
  autoFocus?: boolean
  disabled?: boolean
}

export function QuickCapture({ onSubmit, className, autoFocus, disabled }: QuickCaptureProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || saving || disabled) return

    setSaving(true)
    setText('')

    try {
      await onSubmit(trimmed)
      inputRef.current?.focus()
    } catch {
      setText(trimmed)
      inputRef.current?.focus()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Plus className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleSubmit()
            }
          }}
          placeholder={disabled ? 'Loading…' : 'What do you need to remember?'}
          className="pl-12 py-3.5 text-base"
          autoFocus={autoFocus}
          disabled={disabled || saving}
        />
      </div>
    </div>
  )
}
