import { describe, expect, test } from 'vitest'
import {
  selectLevel,
  withResolvedChildren,
} from '@/features/todo-list/utils/sub-issue-tree'
import { Todo } from '@/types/todo'

const todo = (id: string, parentId: string | null = null): Todo => ({
  id,
  title: id,
  tag: null,
  url: '',
  shareUrl: '',
  contentUrl: null,
  parentId,
})

// root-a ─┬─ child-1 ── grandchild
//         └─ child-2
// root-b (leaf)
const TREE = [
  todo('root-a'),
  todo('root-b'),
  todo('child-1', 'root-a'),
  todo('child-2', 'root-a'),
  todo('grandchild', 'child-1'),
]

describe('withResolvedChildren', () => {
  test('derives children from the fetched set', () => {
    const [rootA] = withResolvedChildren(TREE)

    expect(rootA.subIssueIds).toEqual(['child-1', 'child-2'])
  })

  test('gives a leaf no children', () => {
    const rootB = withResolvedChildren(TREE).find((t) => t.id === 'root-b')

    expect(rootB?.subIssueIds).toEqual([])
  })

  test('ignores the relation ids Notion returned', () => {
    // Notion inlines at most 25 relation entries and includes completed tasks,
    // so the raw value would disagree with what drilling in shows.
    const stale = [{ ...todo('root-a'), subIssueIds: ['who-knows'] }]

    expect(withResolvedChildren(stale)[0].subIssueIds).toEqual([])
  })

  test('does not mutate the input', () => {
    const input = [todo('root-a'), todo('child-1', 'root-a')]
    withResolvedChildren(input)

    expect(input[0].subIssueIds).toBeUndefined()
  })
})

describe('selectLevel', () => {
  test('shows only parentless tasks at a tree root', () => {
    const level = selectLevel(TREE, null, false)

    expect(level.map((t) => t.id)).toEqual(['root-a', 'root-b'])
  })

  test('shows every task at a flat root', () => {
    const level = selectLevel(TREE, null, true)

    expect(level).toHaveLength(TREE.length)
  })

  test('shows exactly one parent’s children when drilled in', () => {
    const level = selectLevel(TREE, 'root-a', false)

    expect(level.map((t) => t.id)).toEqual(['child-1', 'child-2'])
  })

  test('keeps drilling scoped to one level even in flat view', () => {
    const level = selectLevel(TREE, 'root-a', true)

    expect(level.map((t) => t.id)).toEqual(['child-1', 'child-2'])
  })

  test('descends past the first level', () => {
    const level = selectLevel(TREE, 'child-1', false)

    expect(level.map((t) => t.id)).toEqual(['grandchild'])
  })

  test('returns nothing for a parent with no children', () => {
    expect(selectLevel(TREE, 'root-b', false)).toEqual([])
  })
})
