import { describe, expect, test } from 'vitest'
import { resolveDatabase } from '@/features/configuration-form/utils/resolve-database'
import { Database } from '@/types/database'

const database = (
  id: string,
  columns: Partial<Database['columns']> = {}
): Database =>
  ({
    id,
    name: 'Tasks',
    url: 'https://notion.so/db',
    value: '{}',
    image: '',
    columns: {
      title: ['Name'],
      date: ['Due'],
      status: [],
      project: [],
      subIssues: [],
      assignee: [],
      tags: [],
      url: [],
      ...columns,
    },
  } as Database)

const SUB_ISSUE_OPTION = {
  data: { parentProperty: 'Parent item', childProperty: 'Sub-item' },
  value: '{}',
}

/** A copy written before this build learned to detect sub-issue relations. */
const staleCache = {
  id: 'db',
  name: 'Tasks',
  url: 'https://notion.so/db',
  value: '{}',
  image: '',
  columns: { title: ['Name'], date: ['Due'], status: [], project: [] },
} as unknown as Database

describe('resolveDatabase', () => {
  test('prefers the live schema once it has arrived', () => {
    const live = database('db', { subIssues: [SUB_ISSUE_OPTION] })

    const resolved = resolveDatabase(staleCache, [live])

    expect(resolved?.columns.subIssues).toEqual([SUB_ISSUE_OPTION])
  })

  test('falls back to the cache while the live list is still empty', () => {
    const resolved = resolveDatabase(database('db'), [])

    expect(resolved?.id).toBe('db')
  })

  test('fills column lists the cached copy predates, so nothing crashes', () => {
    // Rendering a dropdown from an absent list throws on `.map`.
    const resolved = resolveDatabase(staleCache, [])

    expect(resolved?.columns.subIssues).toEqual([])
  })

  test('ignores live entries for a different database', () => {
    const other = database('other', { subIssues: [SUB_ISSUE_OPTION] })

    const resolved = resolveDatabase(database('db'), [other])

    expect(resolved?.columns.subIssues).toEqual([])
  })

  test('passes null through when nothing is selected yet', () => {
    expect(resolveDatabase(null, [database('db')])).toBeNull()
  })
})
