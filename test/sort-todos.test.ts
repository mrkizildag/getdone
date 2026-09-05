import { describe, expect, test } from 'vitest'
import {
  DEFAULT_SORT_MODE,
  isGroupedSortMode,
  isSortMode,
  sortModeOption,
  sortTodos,
} from '@/features/todo-list/utils/sort-todos'
import { Todo } from '@/types/todo'

const todo = (id: string, overrides: Partial<Todo> = {}): Todo => ({
  id,
  title: id,
  tag: null,
  url: '',
  shareUrl: '',
  contentUrl: null,
  ...overrides,
})

describe('sorting by deadline', () => {
  test('puts the soonest deadline first', () => {
    const sorted = sortTodos(
      [
        todo('later', { date: new Date('2026-03-02') }),
        todo('sooner', { date: new Date('2026-03-01') }),
      ],
      'deadline'
    )

    expect(sorted.map((t) => t.id)).toEqual(['sooner', 'later'])
  })

  test('keeps undated tasks last', () => {
    const sorted = sortTodos(
      [todo('undated'), todo('dated', { date: new Date('2026-03-01') })],
      'deadline'
    )

    expect(sorted.map((t) => t.id)).toEqual(['dated', 'undated'])
  })

  test('ignores the status the task is in', () => {
    const sorted = sortTodos(
      [
        todo('done', {
          status: { id: 'done' },
          date: new Date('2026-03-02'),
        }),
        todo('todo', {
          status: { id: 'todo' },
          date: new Date('2026-03-01'),
        }),
      ],
      'deadline'
    )

    expect(sorted.map((t) => t.id)).toEqual(['todo', 'done'])
  })
})

describe('sorting by title', () => {
  test('orders titles alphabetically', () => {
    const sorted = sortTodos(
      [todo('b', { title: 'Beta' }), todo('a', { title: 'Alpha' })],
      'title'
    )

    expect(sorted.map((t) => t.title)).toEqual(['Alpha', 'Beta'])
  })

  test('does not push lowercase titles behind uppercase ones', () => {
    const sorted = sortTodos(
      [todo('b', { title: 'beta' }), todo('a', { title: 'Alpha' })],
      'title'
    )

    expect(sorted.map((t) => t.title)).toEqual(['Alpha', 'beta'])
  })
})

describe('input safety', () => {
  test('does not reorder the array it was given', () => {
    // The list hands this data straight from the fetch cache, and
    // Array.prototype.sort works in place.
    const input = [
      todo('later', { date: new Date('2026-03-02') }),
      todo('sooner', { date: new Date('2026-03-01') }),
    ]

    sortTodos(input, 'deadline')

    expect(input.map((t) => t.id)).toEqual(['later', 'sooner'])
  })

  test('leaves tasks the mode cannot separate in the order they arrived', () => {
    const sorted = sortTodos([todo('first'), todo('second')], 'deadline')

    expect(sorted.map((t) => t.id)).toEqual(['first', 'second'])
  })
})

describe('reading a stored mode', () => {
  test('accepts a mode the list offers', () => {
    expect(isSortMode('deadline')).toBe(true)
  })

  test('rejects a mode no release defines', () => {
    expect(isSortMode('created')).toBe(false)
    expect(isSortMode(undefined)).toBe(false)
  })

  test('falls back to the grouped mode for an unknown id', () => {
    expect(sortModeOption('nonsense' as never).id).toBe(DEFAULT_SORT_MODE)
  })
})

describe('which modes group', () => {
  test('only status keeps the sections', () => {
    expect(isGroupedSortMode('status')).toBe(true)
    expect(isGroupedSortMode('deadline')).toBe(false)
    expect(isGroupedSortMode('title')).toBe(false)
  })
})
