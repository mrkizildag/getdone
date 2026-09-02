import { describe, expect, test } from 'vitest'
import { parseCapture } from '@/services/notion/utils/parse-capture'

const capture = (text: string, hasUrlProperty = true) =>
  parseCapture(text, { hasUrlProperty })

describe('title extraction', () => {
  test('uses the selection as-is when it is a single line', () => {
    expect(capture('Fix the parser').title).toBe('Fix the parser')
  })

  test('takes the first non-empty line of a multi-line selection', () => {
    // A paragraph makes a terrible task title, and selections often are one.
    expect(capture('\n\nRewrite the relay\nthen deploy it\n').title).toBe(
      'Rewrite the relay'
    )
  })

  test('collapses runs of whitespace', () => {
    expect(capture('Fix    the     parser').title).toBe('Fix the parser')
  })

  test('truncates an over-long line and says so', () => {
    const captured = capture('x'.repeat(200))

    expect(captured.wasTruncated).toBe(true)
    expect(captured.title.endsWith('…')).toBe(true)
    expect(captured.title.length).toBeLessThanOrEqual(121)
  })

  test('reports an empty selection as an empty title', () => {
    expect(capture('   \n  \n ').title).toBe('')
    expect(capture('').title).toBe('')
  })
})

describe('date extraction', () => {
  test('reads a natural-language due date', () => {
    const captured = capture('Ship the relay on 3 March 2030')

    expect(captured.date?.getFullYear()).toBe(2030)
    expect(captured.dateValue).toContain('2030-03-03')
  })

  test('leaves the date absent when the text has none', () => {
    const captured = capture('Ship the relay')

    expect(captured.date).toBeNull()
    expect(captured.dateValue).toBeNull()
  })

  test('ignores a passing mention of a month', () => {
    // Reported from real use: selecting prose containing "September" set a
    // deadline of the 1st, because chrono invents the day it was never told.
    const captured = capture('In September we shipped the relay')

    expect(captured.date).toBeNull()
    expect(captured.dateValue).toBeNull()
    expect(captured.title).toBe('In September we shipped the relay')
  })

  test('ignores a bare month on its own', () => {
    expect(capture('september').date).toBeNull()
    expect(capture('Plan the march').date).toBeNull()
  })

  test('ignores a time of day with no day attached', () => {
    expect(capture('Standup is at 5pm').date).toBeNull()
  })

  test('keeps a date that names an actual day', () => {
    expect(capture('Ship it on 3 March 2030').date?.getDate()).toBe(3)
    expect(capture('Ship it 2030-03-03').date?.getDate()).toBe(3)
  })

  test('keeps a relative date', () => {
    expect(capture('Ship it tomorrow').date).not.toBeNull()
    expect(capture('Ship it next friday').date).not.toBeNull()
  })

  test('resolves a bare weekday forwards, never into the past', () => {
    // A deadline in the past arrives already overdue.
    const captured = capture('Ship it Monday')
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    expect(captured.date?.getTime()).toBeGreaterThanOrEqual(
      startOfToday.getTime()
    )
  })
})

describe('url extraction', () => {
  test('pulls a link out and keeps it off the title', () => {
    const captured = capture('Read https://example.com/spec later')

    expect(captured.contentUrl).toBe('https://example.com/spec')
    expect(captured.title).not.toContain('https://')
  })

  test('leaves the url in place when the database has no url property', () => {
    // Nowhere to store it, so it stays part of what you selected.
    const captured = capture('Read https://example.com/spec', false)

    expect(captured.contentUrl).toBeNull()
    expect(captured.title).toContain('https://example.com/spec')
  })
})
