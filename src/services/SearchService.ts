import type { SearchFilters, Todo, TodoPriority, TodoStatus, TodoType } from '@/types'
import { isOverdue, timestampToDate } from '@/utils/dates'
import { normalizeSearchText } from '@/utils/searchText'

export function parseSearchQuery(query: string): SearchFilters {
  const filters: SearchFilters = {}
  let remaining = query.trim()

  const statusMatch = remaining.match(/\bstatus:(\w+)/i)
  if (statusMatch) {
    const status = statusMatch[1].toLowerCase()
    if (['active', 'completed', 'snoozed', 'archived', 'overdue'].includes(status)) {
      filters.status = status as TodoStatus | 'overdue'
    }
    remaining = remaining.replace(statusMatch[0], '').trim()
  }

  const priorityMatch = remaining.match(/\bpriority:(\w+)/i)
  if (priorityMatch) {
    const priority = priorityMatch[1].toLowerCase()
    if (['none', 'low', 'medium', 'high', 'urgent'].includes(priority)) {
      filters.priority = priority as TodoPriority
    }
    remaining = remaining.replace(priorityMatch[0], '').trim()
  }

  const typeMatch = remaining.match(/\btype:([\w-]+)/i)
  if (typeMatch) {
    const type = typeMatch[1].toLowerCase().replace('-', '_')
    if (['task', 'follow_up', 'waiting', 'idea', 'reminder'].includes(type)) {
      filters.type = type as TodoType
    }
    remaining = remaining.replace(typeMatch[0], '').trim()
  }

  const labelMatches = remaining.match(/#([\w-]+)/g)
  if (labelMatches) {
    filters.labels = labelMatches.map((l) => l.slice(1).toLowerCase())
    remaining = remaining.replace(/#[\w-]+/g, '').trim()
  }

  const personMatch = remaining.match(/@([\w]+)/i)
  if (personMatch) {
    filters.person = personMatch[1].toLowerCase()
    remaining = remaining.replace(personMatch[0], '').trim()
  }

  if (remaining) {
    filters.text = normalizeSearchText(remaining)
  }

  return filters
}

function matchesStatus(todo: Todo, status: TodoStatus | 'overdue'): boolean {
  if (status === 'overdue') {
    if (todo.status === 'completed' || todo.status === 'archived') return false
    const reminderDate = timestampToDate(todo.reminderAt)
    const dueDate = timestampToDate(todo.dueAt)
    if (reminderDate && isOverdue(reminderDate)) return true
    if (dueDate && isOverdue(dueDate)) return true
    return false
  }
  return todo.status === status
}

export function filterTodos(todos: Todo[], filters: SearchFilters): Todo[] {
  return todos.filter((todo) => {
    if (filters.status && !matchesStatus(todo, filters.status)) return false
    if (filters.priority && todo.priority !== filters.priority) return false
    if (filters.type && todo.type !== filters.type) return false

    if (filters.labels?.length) {
      const todoLabels = todo.labels.map((l) => l.toLowerCase())
      if (!filters.labels.every((l) => todoLabels.includes(l))) return false
    }

    if (filters.person) {
      const person = todo.person?.toLowerCase() ?? ''
      if (!person.includes(filters.person)) return false
    }

    if (filters.text) {
      if (!todo.searchText.includes(filters.text)) return false
    }

    return true
  })
}

export function searchTodos(todos: Todo[], query: string): Todo[] {
  if (!query.trim()) return todos
  const filters = parseSearchQuery(query)
  return filterTodos(todos, filters)
}
