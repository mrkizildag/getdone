import { describe, expect, test } from 'vitest'
import { optimisticSorting } from '@/features/todo-list/utils/optimistic-sorting'
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

describe('optimisticSorting', () => {
  test('groups tasks under their status id', () => {
    const grouped = optimisticSorting([
      todo('a', { status: { id: 'todo' } }),
      todo('b', { status: { id: 'doing' } }),
      todo('c', { status: { id: 'todo' } }),
    ])

    expect(Object.keys(grouped).sort()).toEqual(['doing', 'todo'])
    expect(grouped.todo.map((t) => t.id)).toEqual(['a', 'c'])
  })

  test('collects tasks without a status under no-status', () => {
    const grouped = optimisticSorting([todo('a')])

    expect(grouped['no-status'].map((t) => t.id)).toEqual(['a'])
  })

  test('orders dated tasks earliest first', () => {
    const grouped = optimisticSorting([
      todo('later', { date: new Date('2026-03-02') }),
      todo('sooner', { date: new Date('2026-03-01') }),
    ])

    expect(grouped['no-status'].map((t) => t.id)).toEqual(['sooner', 'later'])
  })

  test('sorts dated tasks ahead of undated ones', () => {
    const grouped = optimisticSorting([
      todo('undated'),
      todo('dated', { date: new Date('2026-03-01') }),
    ])

    expect(grouped['no-status'].map((t) => t.id)).toEqual(['dated', 'undated'])
  })
})
