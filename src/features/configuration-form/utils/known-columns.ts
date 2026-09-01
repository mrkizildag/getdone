import { Database } from '@/types/database'

const EMPTY_COLUMNS: Database['columns'] = {
  title: [],
  date: [],
  status: [],
  project: [],
  subIssues: [],
  assignee: [],
  tags: [],
  url: [],
}

/**
 * The settings form reads its selected database from a cached copy, which may
 * have been written by an older build that knew about fewer column lists. A
 * missing list would crash the form on `.map` of undefined, so fill in the ones
 * this build expects before rendering. The dropdown for a filled-in list is
 * simply empty until the live schema arrives.
 */
export function withKnownColumns(database: Database | null): Database | null {
  if (!database) return null

  return {
    ...database,
    columns: { ...EMPTY_COLUMNS, ...database.columns },
  }
}
