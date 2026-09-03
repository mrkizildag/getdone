import * as chrono from 'chrono-node'
import { toISOStringWithTimezone } from '@/features/todo-list/utils/to-iso-string-with-time-zone'

const URL_PATTERN = /(?:https?):\/\/[\n\S]+/g

export interface ParsedDate {
  date: Date
  /** ISO string with offset, the shape Notion's date property expects. */
  dateValue: string
  /** The words chrono matched, so a caller can strip them from the title. */
  matchedText: string
}

/** Reads a natural-language due date out of free text. */
export function parseDate(text: string): ParsedDate | null {
  const matches = chrono.parse(text)
  if (!matches || matches.length === 0) return null

  const date = matches[0].start.date()

  return {
    date,
    dateValue: toISOStringWithTimezone(date),
    matchedText: matches[0].text,
  }
}

/** Reads the first http(s) URL out of free text. */
export function parseUrl(text: string): string | null {
  const matches = text.match(URL_PATTERN)
  return matches ? matches[0] : null
}
