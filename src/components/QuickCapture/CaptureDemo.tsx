import { useEffect, useState } from 'react'
import { Bell, Clock, MessageCircle, Hourglass, Lightbulb, CheckSquare } from 'lucide-react'
import { cn } from '@/utils/cn'

const EXAMPLES = [
  {
    text: 'Follow up with Rahul about the campaign API tomorrow at 11 AM',
    type: 'Follow-up',
    icon: MessageCircle,
    color: 'text-primary',
  },
  {
    text: 'URGENT: review production deployment today at 4 PM',
    type: 'Task',
    icon: CheckSquare,
    color: 'text-danger',
  },
  {
    text: 'Waiting for Ankit to send API credentials, check again Friday',
    type: 'Waiting',
    icon: Hourglass,
    color: 'text-warning',
  },
  {
    text: 'Remind me in 2 hours to send the architecture doc',
    type: 'Reminder',
    icon: Bell,
    color: 'text-success',
  },
  {
    text: 'Idea: automate weekly status report from Jira #backend',
    type: 'Idea',
    icon: Lightbulb,
    color: 'text-text-muted',
  },
]

export function CaptureDemo() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % EXAMPLES.length)
        setVisible(true)
      }, 300)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const example = EXAMPLES[index]
  const Icon = example.icon

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border/60 bg-elevated/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
        <Clock className="h-3.5 w-3.5" />
        <span>Try typing something like</span>
      </div>

      <div
        className={cn(
          'transition-all duration-300',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 rounded-md bg-surface p-1.5', example.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1 inline-block rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {example.type}
            </span>
            <p className="text-sm leading-relaxed text-text-muted">
              &ldquo;{example.text}&rdquo;
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-1">
        {EXAMPLES.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              i === index ? 'w-4 bg-primary' : 'w-1 bg-border',
            )}
          />
        ))}
      </div>
    </div>
  )
}
