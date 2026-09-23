import type { Timestamp } from 'firebase/firestore'

export type TodoStatus = 'active' | 'completed' | 'snoozed' | 'archived'

export type TodoType = 'task' | 'follow_up' | 'waiting' | 'idea' | 'reminder'

export type TodoPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Todo {
  id: string
  userId: string
  title: string
  description?: string
  status: TodoStatus
  type: TodoType
  priority: TodoPriority
  labels: string[]
  project?: string
  person?: string
  dueAt?: Timestamp
  reminderAt?: Timestamp
  completedAt?: Timestamp
  snoozedUntil?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  searchText: string
  source?: {
    type: 'manual' | 'quick_capture'
  }
  recurrence?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    endAt?: Timestamp
  }
}

export interface Label {
  id: string
  name: string
  color?: string
  createdAt: Timestamp
}

export interface Device {
  id: string
  userId: string
  fcmToken: string
  platform: 'web'
  browser?: string
  createdAt: Timestamp
  lastSeenAt: Timestamp
  enabled: boolean
}

export interface UserProfile {
  displayName: string
  email: string
  photoURL?: string
  timezone: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ParsedInput {
  title: string
  reminderAt?: Date
  dueAt?: Date
  person?: string
  labels?: string[]
  type?: TodoType
  priority?: TodoPriority
  confidence: number
}

export interface SearchFilters {
  text?: string
  labels?: string[]
  person?: string
  status?: TodoStatus | 'overdue'
  priority?: TodoPriority
  type?: TodoType
}
