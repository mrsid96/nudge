import { describe, it, expect } from 'vitest'
import { parseDateExpression } from '../dateParser'

describe('parseDateExpression', () => {
  const now = new Date('2026-09-23T10:00:00')

  it('parses tomorrow at 10 AM', () => {
    const result = parseDateExpression('tomorrow at 10 AM', now)
    expect(result.date).toBeDefined()
    expect(result.date!.getDate()).toBe(24)
    expect(result.date!.getHours()).toBe(10)
  })

  it('parses today', () => {
    const result = parseDateExpression('today at 5 PM', now)
    expect(result.date!.getDate()).toBe(23)
    expect(result.date!.getHours()).toBe(17)
  })

  it('parses in 30 minutes', () => {
    const result = parseDateExpression('in 30 minutes', now)
    expect(result.date!.getMinutes()).toBe(30)
  })

  it('parses next week', () => {
    const result = parseDateExpression('next week', now)
    expect(result.date).toBeDefined()
  })

  it('parses Friday', () => {
    const result = parseDateExpression('Friday morning', now)
    expect(result.date).toBeDefined()
    expect(result.date!.getDay()).toBe(5)
  })
})
