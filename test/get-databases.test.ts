import { beforeEach, describe, expect, test, vi } from 'vitest'

const search = vi.fn()

vi.mock('@/services/notion/client', () => ({
  notion: async () => ({ search }),
}))

const DB_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_DB_ID = '22222222-2222-2222-2222-222222222222'

const dualRelation = (
  name: string,
  databaseId: string,
  syncedWith: string
) => ({
  type: 'relation',
  name,
  relation: {
    database_id: databaseId,
    type: 'dual_property',
    dual_property: {
      synced_property_id: 'abc',
      synced_property_name: syncedWith,
    },
  },
})

const database = (properties: Record<string, unknown>) => ({
  id: DB_ID,
  title: [{ plain_text: 'Tasks' }],
  url: 'https://notion.so/db',
  icon: null,
  properties,
})

const subIssueOptions = async (properties: Record<string, unknown>) => {
  search.mockResolvedValue({ results: [database(properties)] })
  const { getDatabases } = await import(
    '@/services/notion/operations/get-databases'
  )
  const [db] = await getDatabases()
  return db.columns.subIssues
}

beforeEach(() => {
  search.mockReset()
})

describe('sub-issue relation detection', () => {
  test('offers None first so sub-issues stay off until chosen', async () => {
    const options = await subIssueOptions({
      Parent: dualRelation('Parent item', DB_ID, 'Sub-item'),
    })

    expect(options[0].data.parentProperty).toBe('None')
  })

  test('detects a relation pointing back at its own database', async () => {
    const options = await subIssueOptions({
      Parent: dualRelation('Parent item', DB_ID, 'Sub-item'),
    })

    expect(options[1].data).toEqual({
      parentProperty: 'Parent item',
      childProperty: 'Sub-item',
    })
  })

  test('ignores a relation pointing at a different database', async () => {
    const options = await subIssueOptions({
      Project: dualRelation('Project', OTHER_DB_ID, 'Tasks'),
    })

    expect(options).toHaveLength(1)
    expect(options[0].data.parentProperty).toBe('None')
  })

  test('ranks the parent-looking side of the pair above the child side', async () => {
    // Notion's native sub-items produce both directions as self-referencing
    // relations; only the naming says which one points at the parent.
    const options = await subIssueOptions({
      Sub: dualRelation('Sub-item', DB_ID, 'Parent item'),
      Parent: dualRelation('Parent item', DB_ID, 'Sub-item'),
    })

    expect(options.map((option) => option.data.parentProperty)).toEqual([
      'None',
      'Parent item',
      'Sub-item',
    ])
  })

  test('detects a single-property relation but exposes no child side', async () => {
    const options = await subIssueOptions({
      Parent: {
        type: 'relation',
        name: 'Blocked by',
        relation: { database_id: DB_ID, type: 'single_property' },
      },
    })

    expect(options[1].data).toEqual({
      parentProperty: 'Blocked by',
      childProperty: undefined,
    })
  })
})

describe('project relation options', () => {
  test('offers a relation pointing at another database', async () => {
    search.mockResolvedValue({
      results: [
        database({ Project: dualRelation('Project', OTHER_DB_ID, 'Tasks') }),
      ],
    })
    const { getDatabases } = await import(
      '@/services/notion/operations/get-databases'
    )
    const [db] = await getDatabases()

    expect(db.columns.project.map((o) => o.data.propertyName)).toContain(
      'Project'
    )
  })

  test('withholds a self-referencing relation', async () => {
    // Offered here it gets picked as the project link, and every task renders
    // its own parent beside it. Hierarchy belongs in the sub-issue setting.
    search.mockResolvedValue({
      results: [
        database({ Parent: dualRelation('Parent item', DB_ID, 'Sub-item') }),
      ],
    })
    const { getDatabases } = await import(
      '@/services/notion/operations/get-databases'
    )
    const [db] = await getDatabases()

    expect(db.columns.project.map((o) => o.data.propertyName)).not.toContain(
      'Parent item'
    )
    expect(db.columns.subIssues.map((o) => o.data.parentProperty)).toContain(
      'Parent item'
    )
  })
})
