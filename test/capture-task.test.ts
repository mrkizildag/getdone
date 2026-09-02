import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Preferences } from '@/services/storage'

const createTodo = vi.fn()
const copy = vi.fn()

vi.mock('@/services/notion/operations/create-todo', () => ({
  createTodo: (...args: unknown[]) => createTodo(...args),
}))
vi.mock('@/services/storage', () => ({
  loadPreferences: async () => currentPreferences,
}))
vi.mock('@/features/todo-list/utils/refresh-menu-bar', () => ({
  refreshMenuBar: () => undefined,
}))
vi.mock('@raycast/api', () => ({ Clipboard: { copy: (t: string) => copy(t) } }))

let currentPreferences: Preferences

const preferences = (overrides: Partial<Preferences> = {}): Preferences =>
  ({
    databaseId: 'db',
    properties: { title: 'Name', date: 'Due', url: 'Link' },
    ...overrides,
  } as Preferences)

const capture = async (text: string) => {
  const { captureTask } = await import('@/features/quick-capture/capture-task')
  return captureTask(text)
}

beforeEach(() => {
  createTodo.mockReset()
  createTodo.mockResolvedValue({ id: 'page-1' })
  copy.mockReset()
  currentPreferences = preferences()
})

describe('captureTask', () => {
  test('creates a task from plain text', async () => {
    const result = await capture('Fix the parser')

    expect(result).toEqual({ ok: true, title: 'Fix the parser' })
    expect(createTodo).toHaveBeenCalledOnce()
    expect(createTodo.mock.calls[0][0].title).toBe('Fix the parser')
  })

  test('carries a parsed due date through to the page', async () => {
    await capture('Ship the relay on 3 March 2030')

    expect(createTodo.mock.calls[0][0].dateValue).toContain('2030-03-03')
  })

  test('refuses text that has no title in it', async () => {
    const result = await capture('   \n  ')

    expect(result).toEqual({ ok: false, message: 'Nothing to add' })
    expect(createTodo).not.toHaveBeenCalled()
  })

  test('refuses when no database is configured yet', async () => {
    currentPreferences = preferences({ databaseId: undefined as never })

    const result = await capture('Fix the parser')

    expect(result.ok).toBe(false)
    expect(createTodo).not.toHaveBeenCalled()
  })

  test('copies the text to the clipboard when Notion rejects it', async () => {
    // The whole point of a capture command is not losing the thought.
    createTodo.mockRejectedValue(new Error('Unauthorized'))

    const result = await capture('Fix the parser')

    expect(result.ok).toBe(false)
    expect(copy).toHaveBeenCalledWith('Fix the parser')
    expect(result.ok === false && result.message).toContain('Unauthorized')
  })

  test('still copies when the failure is not an Error', async () => {
    createTodo.mockRejectedValue('socket hang up')

    const result = await capture('Fix the parser')

    expect(copy).toHaveBeenCalledWith('Fix the parser')
    expect(result.ok === false && result.message).toContain('Could not reach')
  })
})
