import type { ParsedInput, TodoPriority, TodoType } from '@/types'
import { parseDateExpression } from './dateParser'
import { extractLabels } from './labelParser'

const FOLLOW_UP_PATTERNS = [
  /\bfollow\s*up\b/i,
  /\bcheck\s+with\b/i,
  /\bget\s+back\s+to\b/i,
  /\bcircle\s+back\b/i,
]

const WAITING_PATTERNS = [
  /\bwaiting\s+for\b/i,
  /\bwaiting\s+on\b/i,
  /\bpending\s+from\b/i,
]

const PRIORITY_PATTERNS: Array<{ regex: RegExp; priority: TodoPriority }> = [
  { regex: /\b(urgent|asap)\b/i, priority: 'urgent' },
  { regex: /\bhigh\s+priority\b/i, priority: 'high' },
  { regex: /\blow\s+priority\b/i, priority: 'low' },
]

const PERSON_PATTERNS = [
  /\b(?:follow\s+up\s+with|check\s+with|waiting\s+for|waiting\s+on)\s+([A-Za-z]+)/i,
  /\bwith\s+([A-Za-z]+)\b/i,
  /\b@([a-z]+)\b/i,
]

function detectType(text: string): TodoType | undefined {
  if (WAITING_PATTERNS.some((p) => p.test(text))) return 'waiting'
  if (FOLLOW_UP_PATTERNS.some((p) => p.test(text))) return 'follow_up'
  if (/\bremind(?:er)?\b/i.test(text)) return 'reminder'
  if (/\bidea\b/i.test(text)) return 'idea'
  return undefined
}

function detectPriority(text: string): TodoPriority | undefined {
  for (const { regex, priority } of PRIORITY_PATTERNS) {
    if (regex.test(text)) return priority
  }
  return undefined
}

function detectPerson(text: string): string | undefined {
  for (const pattern of PERSON_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      const name = match[1]
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    }
  }
  return undefined
}

function cleanTitle(text: string): string {
  let title = text
    .replace(/^(urgent|asap):\s*/i, '')
    .replace(/\b(high|low)\s+priority\b/gi, '')
    .replace(/\bremind\s+me\b/gi, '')
    .replace(/,\s*check\s+again.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  return title
}

export function parseNaturalLanguage(input: string, now = new Date()): ParsedInput {
  const original = input.trim()
  if (!original) {
    return { title: '', confidence: 0 }
  }

  let confidence = 0.3
  let workingText = original

  const { labels, remainingText: afterLabels } = extractLabels(workingText)
  workingText = afterLabels
  if (labels.length > 0) confidence += 0.1

  const priority = detectPriority(workingText)
  if (priority) confidence += 0.1

  const type = detectType(workingText)
  if (type) confidence += 0.15

  const person = detectPerson(workingText)
  if (person) confidence += 0.1

  const dateResult = parseDateExpression(workingText, now)
  workingText = dateResult.remainingText
  if (dateResult.date) confidence += 0.2

  const title = cleanTitle(workingText) || original

  return {
    title,
    reminderAt: dateResult.date,
    person,
    labels: labels.length > 0 ? labels : undefined,
    type: type ?? (person ? 'follow_up' : 'task'),
    priority: priority ?? 'none',
    confidence: Math.min(confidence, 1),
  }
}
