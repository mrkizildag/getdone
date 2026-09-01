import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Filter } from '@/types/filter'
import { Preferences } from '@/services/storage'
import { SubIssuesConfig } from '@/types/sub-issues'

const query = vi.fn()

vi.mock('@/services/notion/client', () => ({
  notion: async () => ({ databases: { query } }),
}))

vi.mock('@/services/storage', () => ({
  loadPreferences: async () => currentPreferences,
}))

let currentPreferences: Preferences

const SUB_ISSUES: SubIssuesConfig = {
  parentProperty: 'Parent item',
  childProperty: 'Sub-item',
}

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

/** Runs getTodos and returns the `and` clauses it sent to Notion. */
const clausesFor = async (options: {
  subIssues?: SubIssuesConfig
  parentId?: string | null
  scopeToLevel?: boolean
  properties?: Partial<Preferences['properties']>
  filter?: Filter
}) => {
  currentPreferences = preferences({
    ...options.properties,
    subIssues: options.subIssues,
  })
  const { getTodos } = await import('@/services/notion/operations/get-todos')

  await getTodos({
    databaseId: 'db',
    filter: options.filter ?? NO_FILTER,
    accessoryConfig: null,
    parentId: options.parentId ?? null,
    scopeToLevel: options.scopeToLevel ?? false,
  })

  return query.mock.calls.at(-1)?.[0].filter.and as Array<
    Record<string, unknown>
  >
}

const hierarchyClauses = (clauses: Array<Record<string, unknown>>) =>
  clauses.filter((clause) => clause.property === SUB_ISSUES.parentProperty)

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ results: [] })
})

describe('getTodos hierarchy scoping', () => {
  test('asks Notion for parentless tasks at the root of the tree', async () => {
    const clauses = await clausesFor({
      subIssues: SUB_ISSUES,
      parentId: null,
      scopeToLevel: true,
    })

    expect(hierarchyClauses(clauses)).toEqual([
      { property: 'Parent item', relation: { is_empty: true } },
    ])
  })

  test('asks Notion for one parent’s children when drilled in', async () => {
    const clauses = await clausesFor({
      subIssues: SUB_ISSUES,
      parentId: 'parent-123',
      scopeToLevel: true,
    })

    expect(hierarchyClauses(clauses)).toEqual([
      { property: 'Parent item', relation: { contains: 'parent-123' } },
    ])
  })

  test('adds no hierarchy clause in the flat view', async () => {
    // The flat view and the menu bar both rely on this: without it every
    // nested task would silently vanish from the list.
    const clauses = await clausesFor({
      subIssues: SUB_ISSUES,
      parentId: null,
      scopeToLevel: false,
    })

    expect(hierarchyClauses(clauses)).toEqual([])
  })

  test('adds no hierarchy clause when no sub-issue relation is configured', async () => {
    const clauses = await clausesFor({
      subIssues: undefined,
      scopeToLevel: true,
    })

    expect(clauses.some((clause) => 'relation' in clause)).toBe(false)
  })

  test('keeps the done-status clause alongside the hierarchy clause', async () => {
    const clauses = await clausesFor({
      subIssues: SUB_ISSUES,
      parentId: 'parent-123',
      scopeToLevel: true,
    })

    expect(clauses).toContainEqual({
      property: 'Done',
      checkbox: { equals: false },
    })
  })
})

describe('getTodos done-status filtering', () => {
  test('excludes the done option for a plain status property', async () => {
    const clauses = await clausesFor({
      properties: {
        status: { type: 'status', name: 'Status', doneName: 'Done' },
      },
    })

    expect(clauses).toContainEqual({
      property: 'Status',
      status: { does_not_equal: 'Done' },
    })
  })

  test('excludes every completed option when the status has a done group', async () => {
    const clauses = await clausesFor({
      properties: {
        status: {
          type: 'status',
          name: 'Status',
          doneName: 'Shipped',
          completedStatuses: ['Shipped', 'Cancelled'],
        },
      },
    })

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
    const clauses = await clausesFor({
      properties: {
        status: { type: 'status', name: 'Status', doneName: 'Done' },
      },
      filter: {
        ...NO_FILTER,
        status: { id: 's1', name: 'In progress' } as Filter['status'],
      },
    })

    expect(clauses).toEqual([
      { property: 'Status', status: { equals: 'In progress' } },
    ])
  })
})

describe('getTodos dynamic filters', () => {
  test('filters by project relation', async () => {
    const clauses = await clausesFor({
      properties: { project: 'Project' },
      filter: { ...NO_FILTER, projectId: 'proj-1' },
    })

    expect(clauses).toContainEqual({
      property: 'Project',
      relation: { contains: 'proj-1' },
    })
  })

  test('filters by assignee', async () => {
    const clauses = await clausesFor({
      properties: { assignee: 'Owner' },
      filter: { ...NO_FILTER, user: { id: 'user-1' } as Filter['user'] },
    })

    expect(clauses).toContainEqual({
      property: 'Owner',
      people: { contains: 'user-1' },
    })
  })

  test('filters by tag', async () => {
    const clauses = await clausesFor({
      properties: { tag: 'Label' },
      filter: {
        ...NO_FILTER,
        tag: { id: 't1', name: 'urgent' } as Filter['tag'],
      },
    })

    expect(clauses).toContainEqual({
      property: 'Label',
      select: { equals: 'urgent' },
    })
  })

  test('combines a dynamic filter with the hierarchy clause', async () => {
    const clauses = await clausesFor({
      subIssues: SUB_ISSUES,
      parentId: 'parent-123',
      scopeToLevel: true,
      properties: { project: 'Project' },
      filter: { ...NO_FILTER, projectId: 'proj-1' },
    })

    expect(clauses).toContainEqual({
      property: 'Parent item',
      relation: { contains: 'parent-123' },
    })
    expect(clauses).toContainEqual({
      property: 'Project',
      relation: { contains: 'proj-1' },
    })
  })
})

describe('getTodos results', () => {
  test('normalizes each returned page into a todo', async () => {
    currentPreferences = preferences({ subIssues: SUB_ISSUES })
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
    })

    const { getTodos } = await import('@/services/notion/operations/get-todos')
    const todos = await getTodos({
      databaseId: 'db',
      filter: NO_FILTER,
      accessoryConfig: null,
      parentId: null,
      scopeToLevel: true,
    })

    expect(todos).toHaveLength(1)
    expect(todos[0]).toMatchObject({
      id: 'page-1',
      title: 'Ship it',
      parentId: 'parent-1',
      subIssueIds: ['child-1'],
    })
  })
})
