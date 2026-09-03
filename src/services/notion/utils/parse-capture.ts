import { parseExplicitDate, parseUrl } from './parse-text-fields'

/**
 * A selection is prose, not command syntax, so this deliberately does less than
 * the list's search bar: it reads a due date and a link, and leaves everything
 * else alone. Stripping `#project` or `@user` tokens here would mean resolving
 * them against Notion first, and a capture that waits on the network is a
 * capture that does not get used.
 *
 * The date parsing is stricter here too. Capture is blind — nothing shows you
 * what it decided — so it only accepts a date that names an actual day, rather
 * than letting a passing mention of a month become a deadline.
 */
const MAX_TITLE_LENGTH = 120

export interface CapturedTask {
  title: string
  date: Date | null
  dateValue: string | null
  contentUrl: string | null
  /** True when the selection was trimmed to fit a task title. */
  wasTruncated: boolean
}

export function parseCapture(
  text: string,
  { hasUrlProperty }: { hasUrlProperty: boolean }
): CapturedTask {
  const parsedDate = parseExplicitDate(text)
  const contentUrl = hasUrlProperty ? parseUrl(text) : null

  // A whole paragraph makes a terrible task title, and a selection often is
  // one. The first non-empty line is almost always the useful part.
  const firstLine =
    text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? ''

  const withoutUrl = contentUrl ? firstLine.replace(contentUrl, '') : firstLine
  const collapsed = withoutUrl.replace(/\s+/g, ' ').trim()
  const wasTruncated = collapsed.length > MAX_TITLE_LENGTH

  return {
    title: wasTruncated
      ? `${collapsed.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
      : collapsed,
    date: parsedDate?.date ?? null,
    dateValue: parsedDate?.dateValue ?? null,
    contentUrl,
    wasTruncated,
  }
}
