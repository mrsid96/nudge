import { addDays, addHours, setHours, setMinutes, startOfDay } from 'date-fns'
import { Button } from '@/components/ui/Button'

interface ReminderPickerProps {
  onSelect: (date: Date) => void
  onCancel: () => void
}

const OPTIONS = [
  { label: 'Later today', getDate: () => addHours(new Date(), 3) },
  { label: 'Tomorrow morning', getDate: () => setMinutes(setHours(addDays(startOfDay(new Date()), 1), 9), 0) },
  { label: 'Tomorrow afternoon', getDate: () => setMinutes(setHours(addDays(startOfDay(new Date()), 1), 14), 0) },
  { label: 'Next week', getDate: () => addDays(startOfDay(new Date()), 7) },
]

export function ReminderPicker({ onSelect, onCancel }: ReminderPickerProps) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-4 shadow-lg">
      <p className="mb-3 text-sm font-medium">Remind me</p>
      <div className="flex flex-col gap-1">
        {OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option.getDate())}
            className="rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-surface"
          >
            {option.label}
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
