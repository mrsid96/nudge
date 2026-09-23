import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { CommentService } from '@/services/CommentService'
import type { TodoComment } from '@/types'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'

interface CommentTrailProps {
  todoId: string
}

export function CommentTrail({ todoId }: CommentTrailProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<TodoComment[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    const service = new CommentService(user.uid, todoId)
    return service.subscribe(setComments)
  }, [user, todoId])

  if (!user) return null

  const service = new CommentService(user.uid, todoId)

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await service.add(trimmed)
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-wider text-text-muted">
        Pending actions
      </label>

      {comments.length > 0 && (
        <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-bg px-3 py-2"
            >
              <p className="text-sm leading-relaxed">{comment.text}</p>
              <p className="mt-1 text-xs text-text-muted">
                {comment.createdAt
                  ? format(comment.createdAt.toDate(), 'MMM d, h:mm a')
                  : 'Just now'}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Add a pending action or note..."
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          aria-label="Add comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
