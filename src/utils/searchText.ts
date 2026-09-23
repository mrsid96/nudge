import type { Todo } from '@/types'

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s#@]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSearchText(todo: {
  title: string
  description?: string
  person?: string
  project?: string
  labels?: string[]
  type?: string
}): string {
  const parts = [
    todo.title,
    todo.description,
    todo.person,
    todo.project,
    ...(todo.labels ?? []),
    todo.type?.replace('_', '-'),
  ].filter(Boolean)

  return normalizeSearchText(parts.join(' '))
}

export function matchesSearchText(todo: Todo, query: string): boolean {
  const normalized = normalizeSearchText(query)
  if (!normalized) return true
  return todo.searchText.includes(normalized)
}
