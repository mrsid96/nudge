import { describe, expect, it } from 'vitest'
import { buildFromCapture, localTodoToCreateInput } from '../todoMutations'

describe('todoMutations', () => {
  it('builds capture todos with reminder dates', () => {
    const { todo } = buildFromCapture('user-1', 'Follow up with Rahul tomorrow')
    expect(todo.title).toBeTruthy()
    expect(todo.reminderAt || todo.dueAt).toBeTruthy()
  })

  it('converts local todo to create input after IDB round-trip', () => {
    const { todo } = buildFromCapture('user-1', 'Review PR tomorrow')
    const stored = JSON.parse(JSON.stringify(todo))
    const input = localTodoToCreateInput(stored)
    expect(input.reminderAt).toBeInstanceOf(Date)
  })
})
