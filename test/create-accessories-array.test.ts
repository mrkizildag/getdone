import { describe, expect, test } from 'vitest'
import { createAccessoriesArray } from '@/utils/create-accessories-array'
import { Todo } from '@/types/todo'
import { Filter } from '@/types/filter'

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

describe('accessory order', () => {
  const FULL_TODO: Partial<Todo> = {
    user: { id: 'u1', name: 'Mete', icon: '' } as Todo['user'],
    tag: { id: 't1', name: 'urgent', color: 'red' } as Todo['tag'],
    date: new Date('2030-01-01'),
    subIssueIds: ['a', 'b'],
  }

  const kinds = (accessories: ReturnType<typeof createAccessoriesArray>) =>
    accessories.map((accessory) => {
      if ('tag' in accessory && accessory.tag) return 'label'
      if ('date' in accessory && accessory.date) return 'deadline'
      if (accessory.text) return 'chevron'
      return 'user'
    })

  test('runs assignee first, then deadline, label, chevron', () => {
    // Raycast renders accessories left to right, so this array is the row.
    const accessories = createAccessoriesArray({
      todo: { ...todo(), ...FULL_TODO },
      projectsById: {},
    })

    expect(kinds(accessories)).toEqual(['user', 'deadline', 'label', 'chevron'])
  })

  test('keeps the chevron hard right when the deadline is absent', () => {
    const accessories = createAccessoriesArray({
      todo: { ...todo(), ...FULL_TODO, date: undefined },
      projectsById: {},
    })

    expect(kinds(accessories)).toEqual(['user', 'label', 'chevron'])
  })

  test('collapses cleanly when only the chevron applies', () => {
    const accessories = createAccessoriesArray({
      todo: { ...todo(), subIssueIds: ['a'] },
      projectsById: {},
    })

    expect(kinds(accessories)).toEqual(['chevron'])
  })

  test('drops the label when the list is already filtered by it', () => {
    const accessories = createAccessoriesArray({
      todo: { ...todo(), ...FULL_TODO },
      projectsById: {},
      filter: {
        projectId: null,
        user: null,
        status: null,
        tag: { id: 't1', name: 'urgent' } as Filter['tag'],
      },
    })

    expect(kinds(accessories)).toEqual(['user', 'deadline', 'chevron'])
  })
})
