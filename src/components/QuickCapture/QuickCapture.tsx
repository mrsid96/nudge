import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

interface QuickCaptureProps {
  onSubmit: (text: string) => void
  className?: string
  autoFocus?: boolean
}

export function QuickCapture({ onSubmit, className, autoFocus }: QuickCaptureProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return

    setText('')
    onSubmit(trimmed)
    inputRef.current?.focus()
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
              handleSubmit()
            }
          }}
          placeholder="What do you need to remember?"
          className="pl-12 py-3.5 text-base"
          autoFocus={autoFocus}
        />
      </div>
    </div>
  )
}
