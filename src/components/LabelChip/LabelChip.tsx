import { cn } from '@/utils/cn'

interface LabelChipProps {
  name: string
  color?: string
  onClick?: () => void
  className?: string
}

export function LabelChip({ name, color, onClick, className }: LabelChipProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        onClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
      style={{
        backgroundColor: color ? `${color}20` : 'rgba(99, 102, 241, 0.15)',
        color: color ?? '#818cf8',
      }}
    >
      {name}
    </span>
  )
}
