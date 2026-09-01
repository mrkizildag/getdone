import { describe, expect, test } from 'vitest'
import { createAccessoriesArray } from '@/utils/create-accessories-array'
import { Todo } from '@/types/todo'

const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'a',
  title: 'Ship the thing',
  tag: null,
  url: '',
  shareUrl: '',
  contentUrl: null,
  ...overrides,
})

const accessoriesFor = (overrides: Partial<Todo> = {}) =>
  createAccessoriesArray({ todo: todo(overrides), projectsById: {} })

describe('sub-issue count badge', () => {
  test('shows the number of children on a parent task', () => {
    const accessories = accessoriesFor({ subIssueIds: ['x', 'y', 'z'] })

    expect(accessories).toContainEqual(
      expect.objectContaining({ text: '3', tooltip: '3 sub-issues' })
    )
  })

  test('uses the singular form for a single child', () => {
    const accessories = accessoriesFor({ subIssueIds: ['x'] })

    expect(accessories).toContainEqual(
      expect.objectContaining({ text: '1', tooltip: '1 sub-issue' })
    )
  })

  test('shows no badge on a leaf task', () => {
    const accessories = accessoriesFor({ subIssueIds: [] })

    expect(accessories).toEqual([])
  })

  test('shows no badge when sub-issues are not configured at all', () => {
    expect(accessoriesFor()).toEqual([])
  })
})
