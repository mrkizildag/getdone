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

/**
 * Like `parseDate`, but only when the text pins down an actual day.
 *
 * chrono is deliberately eager: it reads a bare "September" as a date and
 * quietly invents the 1st for the day it was never told. That is fine in the
 * search bar, where the parsed date is shown back as you type and you can see
 * it guess wrong — but a capture command is blind, so prose that merely
 * mentions a month would silently acquire a deadline.
 *
 * A parse counts as explicit when chrono is *certain* of a `day` or a
 * `weekday`, rather than having implied one. "tomorrow", "next friday" and "3 March 2030" all
 * qualify; "September" and "at 5pm" do not.
 */
export function parseExplicitDate(text: string): ParsedDate | null {
  // forwardDate because these become deadlines: chrono otherwise resolves a
  // bare weekday to whichever is nearest, which for "due Monday" on a Thursday
  // means last Monday — a task that arrives already overdue.
  const matches = chrono.parse(text, undefined, { forwardDate: true })
  if (!matches || matches.length === 0) return null

  const start = matches[0].start
  if (!start.isCertain('day') && !start.isCertain('weekday')) return null

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
