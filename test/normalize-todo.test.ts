import { describe, expect, test } from 'vitest'
import { normalizeTodo } from '@/services/notion/utils/normalize-todo'
import { Preferences } from '@/services/storage'
import { SubIssuesConfig } from '@/types/sub-issues'

const relation = (...ids: string[]) => ({ relation: ids.map((id) => ({ id })) })

const page = (properties: Record<string, unknown> = {}) => ({
  id: 'page-1',
  url: 'https://www.notion.so/page-1',
  properties: {
    Name: { title: [{ text: { content: 'Ship the thing' } }] },
    Due: { date: null },
    Done: { status: {} },
    ...properties,
  },
})

const properties = (subIssues?: SubIssuesConfig): Preferences['properties'] =>
  ({
    title: 'Name',
    date: 'Due',
    status: { type: 'checkbox', name: 'Done' },
    subIssues,
  } as Preferences['properties'])

const SUB_ISSUES: SubIssuesConfig = {
  parentProperty: 'Parent item',
  childProperty: 'Sub-item',
}

describe('normalizeTodo sub-issue relations', () => {
  test('reads the parent id off the configured relation', () => {
    const todo = normalizeTodo({
      page: page({
        'Parent item': relation('parent-1'),
        'Sub-item': relation(),
      }),
      preferences: properties(SUB_ISSUES),
      accessoryConfig: null,
    })

    expect(todo.parentId).toBe('parent-1')
  })

  test('reads every child id off the configured relation', () => {
    const todo = normalizeTodo({
      page: page({
        'Parent item': relation(),
        'Sub-item': relation('child-1', 'child-2'),
      }),
      preferences: properties(SUB_ISSUES),
      accessoryConfig: null,
    })

    expect(todo.subIssueIds).toEqual(['child-1', 'child-2'])
  })

  test('treats a task with an empty parent relation as top level', () => {
    const todo = normalizeTodo({
      page: page({ 'Parent item': relation(), 'Sub-item': relation() }),
      preferences: properties(SUB_ISSUES),
      accessoryConfig: null,
    })

    expect(todo.parentId).toBeNull()
    expect(todo.subIssueIds).toEqual([])
  })

  test('returns no hierarchy when no sub-issue relation is configured', () => {
    const todo = normalizeTodo({
      page: page({ 'Parent item': relation('parent-1') }),
      preferences: properties(undefined),
      accessoryConfig: null,
    })

    expect(todo.parentId).toBeNull()
    expect(todo.subIssueIds).toEqual([])
  })

  test('survives a single-property relation that exposes no child side', () => {
    // Notion only returns child ids inline for dual-property relations.
    const todo = normalizeTodo({
      page: page({ 'Parent item': relation('parent-1') }),
      preferences: properties({ parentProperty: 'Parent item' }),
      accessoryConfig: null,
    })

    expect(todo.parentId).toBe('parent-1')
    expect(todo.subIssueIds).toEqual([])
  })

  test('survives a page where the relation properties are absent entirely', () => {
    const todo = normalizeTodo({
      page: page(),
      preferences: properties(SUB_ISSUES),
      accessoryConfig: null,
    })

    expect(todo.parentId).toBeNull()
    expect(todo.subIssueIds).toEqual([])
  })
})
