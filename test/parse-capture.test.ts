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
