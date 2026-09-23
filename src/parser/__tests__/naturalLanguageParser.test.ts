import { describe, it, expect } from 'vitest'
import { parseNaturalLanguage } from '../naturalLanguageParser'

describe('parseNaturalLanguage', () => {
  it('parses follow up with person and tomorrow reminder', () => {
    const result = parseNaturalLanguage(
      'Follow up with Rahul about the campaign measurement API tomorrow at 11 AM',
      new Date('2026-09-23T08:00:00'),
    )

    expect(result.title).toContain('Rahul')
    expect(result.type).toBe('follow_up')
    expect(result.person).toBe('Rahul')
    expect(result.reminderAt).toBeDefined()
    expect(result.reminderAt!.getHours()).toBe(11)
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('parses urgent priority', () => {
    const result = parseNaturalLanguage(
      'URGENT: review production deployment today at 4 PM',
      new Date('2026-09-23T08:00:00'),
    )

    expect(result.priority).toBe('urgent')
    expect(result.title.toLowerCase()).toContain('review')
    expect(result.reminderAt).toBeDefined()
  })

  it('parses waiting type with person', () => {
    const result = parseNaturalLanguage(
      'Waiting for Rahul to send credentials, check again Friday',
      new Date('2026-09-23T08:00:00'),
    )

    expect(result.type).toBe('waiting')
    expect(result.person).toBe('Rahul')
    expect(result.reminderAt).toBeDefined()
  })

  it('extracts labels', () => {
    const result = parseNaturalLanguage('Fix API issue #backend #work')
    expect(result.labels).toEqual(['backend', 'work'])
    expect(result.title).toContain('API')
  })

  it('preserves full text as title when parsing is minimal', () => {
    const result = parseNaturalLanguage('Remember to buy milk')
    expect(result.title).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('parses in 2 hours', () => {
    const now = new Date('2026-09-23T10:00:00')
    const result = parseNaturalLanguage('Remind me in 2 hours', now)
    expect(result.reminderAt).toBeDefined()
    expect(result.reminderAt!.getHours()).toBe(12)
  })
})
