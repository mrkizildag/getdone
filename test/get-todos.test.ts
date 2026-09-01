import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Filter } from '@/types/filter'
import { Preferences } from '@/services/storage'

const query = vi.fn()

vi.mock('@/services/notion/client', () => ({
  notion: async () => ({ databases: { query } }),
}))

vi.mock('@/services/storage', () => ({
  loadPreferences: async () => currentPreferences,
}))

let currentPreferences: Preferences

const preferences = (
  properties: Partial<Preferences['properties']> = {}
): Preferences =>
  ({
    databaseId: 'db',
    databaseName: 'Tasks',
    databaseUrl: 'https://notion.so/db',
    normalizedUrl: 'notion://db',
    properties: {
      title: 'Name',
      date: 'Due',
      status: { type: 'checkbox', name: 'Done' },
      ...properties,
    },
  } as Preferences)

const NO_FILTER: Filter = {
  projectId: null,
  user: null,
  tag: null,
  status: null,
}

const page = (id: string) => ({
  id,
  url: `https://www.notion.so/${id}`,
  properties: {
    Name: { title: [{ text: { content: id } }] },
    Due: { date: null },
    Done: { status: {} },
  },
})

const run = async (
  options: {
    properties?: Partial<Preferences['properties']>
    filter?: Filter
  } = {}
) => {
  currentPreferences = preferences(options.properties)
  const { getTodos } = await import('@/services/notion/operations/get-todos')

  return getTodos({
    databaseId: 'db',
    filter: options.filter ?? NO_FILTER,
    accessoryConfig: null,
  })
}

const lastClauses = () =>
  query.mock.calls.at(-1)?.[0].filter.and as Array<Record<string, unknown>>

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ results: [], has_more: false, next_cursor: null })
})

describe('getTodos pagination', () => {
  test('follows the cursor until Notion runs out of pages', async () => {
    // The tree is assembled client-side, so every level must arrive in one go.
    // Notion caps a page at 100, which a nested database exceeds easily.
    query
      .mockResolvedValueOnce({
        results: [page('a')],
        has_more: true,
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        results: [page('b')],
        has_more: false,
        next_cursor: null,
      })

    const todos = await run()

    expect(query).toHaveBeenCalledTimes(2)
    expect(todos.map((t) => t.id)).toEqual(['a', 'b'])
  })

  test('passes the cursor back on the follow-up request', async () => {
    query
      .mockResolvedValueOnce({
        results: [page('a')],
        has_more: true,
        next_cursor: 'cursor-1',
      })
      .mockResolvedValueOnce({
        results: [],
        has_more: false,
        next_cursor: null,
      })

    await run()

    expect(query.mock.calls[0][0].start_cursor).toBeUndefined()
    expect(query.mock.calls[1][0].start_cursor).toBe('cursor-1')
  })

  test('stops after a single request when there is no more data', async () => {
    await run()

    expect(query).toHaveBeenCalledTimes(1)
  })

  test('does not scope the query to one level of the tree', async () => {
    // Hierarchy is derived in memory now; a server-side parent filter would
    // hide the deeper levels the tree needs.
    const clauses = await run({
      properties: { subIssues: { parentProperty: 'Parent item' } },
    }).then(lastClauses)

    expect(clauses.some((clause) => clause.property === 'Parent item')).toBe(
      false
    )
  })
})

describe('getTodos done-status filtering', () => {
  test('excludes the done option for a plain status property', async () => {
    const clauses = await run({
      properties: {
        status: { type: 'status', name: 'Status', doneName: 'Done' },
      },
    }).then(lastClauses)

    expect(clauses).toContainEqual({
      property: 'Status',
      status: { does_not_equal: 'Done' },
    })
  })

  test('excludes every completed option when the status has a done group', async () => {
    const clauses = await run({
      properties: {
        status: {
          type: 'status',
          name: 'Status',
          doneName: 'Shipped',
          completedStatuses: ['Shipped', 'Cancelled'],
        },
      },
    }).then(lastClauses)

    expect(clauses).toContainEqual({
      property: 'Status',
      status: { does_not_equal: 'Shipped' },
    })
    expect(clauses).toContainEqual({
      property: 'Status',
      status: { does_not_equal: 'Cancelled' },
    })
  })

  test('drops the done-status clause when filtering by an explicit status', async () => {
    const clauses = await run({
      properties: {
        status: { type: 'status', name: 'Status', doneName: 'Done' },
      },
      filter: {
        ...NO_FILTER,
        status: { id: 's1', name: 'In progress' } as Filter['status'],
      },
    }).then(lastClauses)

    expect(clauses).toEqual([
      { property: 'Status', status: { equals: 'In progress' } },
    ])
  })
})

describe('getTodos dynamic filters', () => {
  test('filters by project relation', async () => {
    const clauses = await run({
      properties: { project: 'Project' },
      filter: { ...NO_FILTER, projectId: 'proj-1' },
    }).then(lastClauses)

    expect(clauses).toContainEqual({
      property: 'Project',
      relation: { contains: 'proj-1' },
    })
  })

  test('filters by assignee', async () => {
    const clauses = await run({
      properties: { assignee: 'Owner' },
      filter: { ...NO_FILTER, user: { id: 'user-1' } as Filter['user'] },
    }).then(lastClauses)

    expect(clauses).toContainEqual({
      property: 'Owner',
      people: { contains: 'user-1' },
    })
  })

  test('filters by tag', async () => {
    const clauses = await run({
      properties: { tag: 'Label' },
      filter: {
        ...NO_FILTER,
        tag: { id: 't1', name: 'urgent' } as Filter['tag'],
      },
    }).then(lastClauses)

    expect(clauses).toContainEqual({
      property: 'Label',
      select: { equals: 'urgent' },
    })
  })
})

describe('getTodos results', () => {
  test('normalizes each returned page into a todo', async () => {
    query.mockResolvedValue({
      results: [
        {
          id: 'page-1',
          url: 'https://www.notion.so/page-1',
          properties: {
            Name: { title: [{ text: { content: 'Ship it' } }] },
            Due: { date: null },
            Done: { status: {} },
            'Parent item': { relation: [{ id: 'parent-1' }] },
            'Sub-item': { relation: [{ id: 'child-1' }] },
          },
        },
      ],
      has_more: false,
      next_cursor: null,
    })

    const todos = await run({
      properties: {
        subIssues: { parentProperty: 'Parent item', childProperty: 'Sub-item' },
      },
    })

    expect(todos[0]).toMatchObject({
      id: 'page-1',
      title: 'Ship it',
      parentId: 'parent-1',
      subIssueIds: ['child-1'],
    })
  })
})
