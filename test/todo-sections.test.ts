import { describe, expect, test } from 'vitest'
import { buildTodoSections } from '@/features/todo-list/utils/todo-sections'
import { Status } from '@/types/status'
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

const status = (id: string, name: string): Status =>
  ({ id, name, color: 'blue', icon: 'pending.svg' } as unknown as Status)

const statuses = [status('todo', 'To-do'), status('doing', 'In Progress')]

describe('grouped by status', () => {
  test('renders one section per status, in database order', () => {
    const sections = buildTodoSections({
      todos: [
        todo('a', { status: { id: 'doing' } }),
        todo('b', { status: { id: 'todo' } }),
      ],
      statuses,
      sortMode: 'status',
    })

    expect(sections.map((section) => section.title)).toEqual([
      'To-do',
      'In Progress',
    ])
    expect(sections[0].todos.map((t) => t.id)).toEqual(['b'])
  })

  test('keeps a status with no tasks as an empty section', () => {
    const sections = buildTodoSections({
      todos: [todo('a', { status: { id: 'todo' } })],
      statuses,
      sortMode: 'status',
    })

    expect(sections[1].todos).toEqual([])
    expect(sections[1].subtitle).toBe('0 issues')
  })

  test('orders each status by deadline', () => {
    const sections = buildTodoSections({
      todos: [
        todo('later', {
          status: { id: 'todo' },
          date: new Date('2026-03-02'),
        }),
        todo('sooner', {
          status: { id: 'todo' },
          date: new Date('2026-03-01'),
        }),
      ],
      statuses,
      sortMode: 'status',
    })

    expect(sections[0].todos.map((t) => t.id)).toEqual(['sooner', 'later'])
  })

  test('names the status every row in the section shares', () => {
    const sections = buildTodoSections({
      todos: [todo('a', { status: { id: 'todo' } })],
      statuses,
      sortMode: 'status',
    })

    expect(sections[0].status?.id).toBe('todo')
  })
})

describe('sorted across statuses', () => {
  test('collapses the statuses into a single section', () => {
    const sections = buildTodoSections({
      todos: [
        todo('a', { status: { id: 'doing' }, date: new Date('2026-03-02') }),
        todo('b', { status: { id: 'todo' }, date: new Date('2026-03-01') }),
      ],
      statuses,
      sortMode: 'deadline',
    })

    expect(sections).toHaveLength(1)
    expect(sections[0].todos.map((t) => t.id)).toEqual(['b', 'a'])
  })

  test('says which order the flattened list is in', () => {
    const sections = buildTodoSections({
      todos: [todo('a')],
      statuses,
      sortMode: 'deadline',
    })

    expect(sections[0].title).toBe('By Deadline')
    expect(sections[0].subtitle).toBe('1 issue')
  })

  test('leaves the section without a status of its own', () => {
    const sections = buildTodoSections({
      todos: [todo('a', { status: { id: 'todo' } })],
      statuses,
      sortMode: 'title',
    })

    expect(sections[0].status).toBeNull()
  })

  test('keeps tasks whose status is missing from the database', () => {
    // Grouping drops them, because it only walks the known statuses. Flattening
    // has no such filter, and losing rows on a re-sort would look like a bug.
    const sections = buildTodoSections({
      todos: [todo('orphan')],
      statuses,
      sortMode: 'title',
    })

    expect(sections[0].todos.map((t) => t.id)).toEqual(['orphan'])
  })
})
